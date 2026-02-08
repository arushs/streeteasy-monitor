import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const VALID_STATUSES = ["pending", "approved", "rejected", "sent"] as const;

/**
 * Helper to get authenticated user ID or throw
 */
async function requireAuth(ctx: { auth: { getUserIdentity: () => Promise<any> } }): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Authentication required");
  }
  return identity.subject;
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get pending queue items for review
 */
export const listPending = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const limit = Math.min(args.limit ?? 50, 100);
    
    return await ctx.db
      .query("contactQueue")
      .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "pending"))
      .order("desc")
      .take(limit);
  },
});

/**
 * Get queue stats
 */
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    
    const items = await ctx.db
      .query("contactQueue")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    const stats = {
      total: items.length,
      byStatus: {} as Record<string, number>,
    };
    
    for (const item of items) {
      stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1;
    }
    
    return stats;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Add a listing to the contact queue (for auto-contact)
 */
export const add = mutation({
  args: {
    listingId: v.id("listings"),
    templateId: v.id("templates"),
    subject: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    // Verify listing belongs to user
    const listing = await ctx.db.get(args.listingId);
    if (!listing) throw new Error("Listing not found");
    if (listing.userId !== userId) throw new Error("Access denied");
    
    // Check if already in queue
    const existing = await ctx.db
      .query("contactQueue")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("listingId"), args.listingId))
      .first();
    
    if (existing) {
      throw new Error("Listing already in queue");
    }
    
    // Also check if already contacted
    const existingContact = await ctx.db
      .query("contacts")
      .withIndex("by_listing", (q) => q.eq("listingId", args.listingId))
      .first();
    
    if (existingContact) {
      throw new Error("Already contacted about this listing");
    }
    
    return await ctx.db.insert("contactQueue", {
      userId,
      listingId: args.listingId,
      templateId: args.templateId,
      subject: args.subject,
      body: args.body,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

/**
 * Approve a queued contact
 */
export const approve = mutation({
  args: {
    id: v.id("contactQueue"),
    subject: v.optional(v.string()),  // Allow editing before approval
    body: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Queue item not found");
    if (item.userId !== userId) throw new Error("Access denied");
    if (item.status !== "pending") throw new Error("Can only approve pending items");
    
    const subject = args.subject?.trim() || item.subject;
    const body = args.body?.trim() || item.body;
    
    await ctx.db.patch(args.id, {
      status: "approved",
      subject,
      body,
      processedAt: Date.now(),
    });
    
    return { success: true };
  },
});

/**
 * Reject a queued contact
 */
export const reject = mutation({
  args: {
    id: v.id("contactQueue"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Queue item not found");
    if (item.userId !== userId) throw new Error("Access denied");
    if (item.status !== "pending") throw new Error("Can only reject pending items");
    
    await ctx.db.patch(args.id, {
      status: "rejected",
      processedAt: Date.now(),
    });
    
    // Mark listing as rejected too
    await ctx.db.patch(item.listingId, { status: "rejected" });
    
    return { success: true };
  },
});

/**
 * Batch approve multiple items
 */
export const batchApprove = mutation({
  args: {
    ids: v.array(v.id("contactQueue")),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    let approved = 0;
    let failed = 0;
    
    for (const id of args.ids) {
      const item = await ctx.db.get(id);
      if (!item || item.userId !== userId || item.status !== "pending") {
        failed++;
        continue;
      }
      
      await ctx.db.patch(id, {
        status: "approved",
        processedAt: Date.now(),
      });
      approved++;
    }
    
    return { approved, failed };
  },
});

/**
 * Batch reject multiple items
 */
export const batchReject = mutation({
  args: {
    ids: v.array(v.id("contactQueue")),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    let rejected = 0;
    let failed = 0;
    
    for (const id of args.ids) {
      const item = await ctx.db.get(id);
      if (!item || item.userId !== userId || item.status !== "pending") {
        failed++;
        continue;
      }
      
      await ctx.db.patch(id, {
        status: "rejected",
        processedAt: Date.now(),
      });
      
      // Mark listing as rejected
      await ctx.db.patch(item.listingId, { status: "rejected" });
      rejected++;
    }
    
    return { rejected, failed };
  },
});

/**
 * Mark queue item as sent (after email is sent)
 */
export const markSent = mutation({
  args: {
    id: v.id("contactQueue"),
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Queue item not found");
    if (item.userId !== userId) throw new Error("Access denied");
    
    await ctx.db.patch(args.id, {
      status: "sent",
      processedAt: Date.now(),
    });
    
    return { success: true };
  },
});

/**
 * Get approved items ready to send
 */
export const getApproved = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const limit = Math.min(args.limit ?? 10, 50);
    
    return await ctx.db
      .query("contactQueue")
      .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "approved"))
      .order("asc") // FIFO
      .take(limit);
  },
});
