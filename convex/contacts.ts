import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const VALID_STATUSES = ["queued", "sent", "delivered", "replied", "failed"] as const;

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
 * Get all contacts for the authenticated user
 */
export const list = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const limit = Math.min(args.limit ?? 100, 500);
    
    let query;
    if (args.status) {
      query = ctx.db
        .query("contacts")
        .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", args.status!));
    } else {
      query = ctx.db
        .query("contacts")
        .withIndex("by_user", (q) => q.eq("userId", userId));
    }
    
    return await query.order("desc").take(limit);
  },
});

/**
 * Get contacts for a specific listing
 */
export const getByListing = query({
  args: { listingId: v.id("listings") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const listing = await ctx.db.get(args.listingId);
    if (!listing) throw new Error("Listing not found");
    if (listing.userId !== userId) throw new Error("Access denied");
    
    return await ctx.db
      .query("contacts")
      .withIndex("by_listing", (q) => q.eq("listingId", args.listingId))
      .order("desc")
      .collect();
  },
});

/**
 * Get a single contact
 */
export const get = query({
  args: { id: v.id("contacts") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const contact = await ctx.db.get(args.id);
    if (!contact) throw new Error("Contact not found");
    if (contact.userId !== userId) throw new Error("Access denied");
    
    return contact;
  },
});

/**
 * Get contact stats for the authenticated user
 */
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    // Today's count for daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();
    
    const todayCount = contacts.filter(
      (c) => c.sentAt && c.sentAt >= todayTimestamp
    ).length;
    
    const stats = {
      total: contacts.length,
      todaySent: todayCount,
      byStatus: {} as Record<string, number>,
      responseRate: 0,
    };
    
    for (const contact of contacts) {
      stats.byStatus[contact.status] = (stats.byStatus[contact.status] || 0) + 1;
    }
    
    // Calculate response rate
    const sentOrReplied = contacts.filter(
      (c) => c.status === "sent" || c.status === "delivered" || c.status === "replied"
    ).length;
    
    if (sentOrReplied > 0) {
      stats.responseRate = (stats.byStatus["replied"] || 0) / sentOrReplied;
    }
    
    return stats;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new contact (queue for sending)
 */
export const create = mutation({
  args: {
    listingId: v.id("listings"),
    templateId: v.optional(v.id("templates")),
    subject: v.string(),
    body: v.string(),
    recipientEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    // Verify listing belongs to user
    const listing = await ctx.db.get(args.listingId);
    if (!listing) throw new Error("Listing not found");
    if (listing.userId !== userId) throw new Error("Access denied");
    
    // Check if already contacted this listing
    const existingContact = await ctx.db
      .query("contacts")
      .withIndex("by_listing", (q) => q.eq("listingId", args.listingId))
      .first();
    
    if (existingContact) {
      throw new Error("Already contacted about this listing");
    }
    
    // Validate
    if (!args.subject.trim()) throw new Error("Subject is required");
    if (!args.body.trim()) throw new Error("Body is required");
    if (args.subject.length > 200) throw new Error("Subject too long");
    if (args.body.length > 10000) throw new Error("Body too long");
    
    return await ctx.db.insert("contacts", {
      userId,
      listingId: args.listingId,
      templateId: args.templateId,
      subject: args.subject.trim(),
      body: args.body.trim(),
      recipientEmail: args.recipientEmail?.trim(),
      status: "queued",
      createdAt: Date.now(),
    });
  },
});

/**
 * Mark contact as sent
 */
export const markSent = mutation({
  args: {
    id: v.id("contacts"),
    messageId: v.optional(v.string()),
    threadId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const contact = await ctx.db.get(args.id);
    if (!contact) throw new Error("Contact not found");
    if (contact.userId !== userId) throw new Error("Access denied");
    
    await ctx.db.patch(args.id, {
      status: "sent",
      sentAt: Date.now(),
      messageId: args.messageId,
      threadId: args.threadId,
    });
    
    // Update listing status to reached_out
    await ctx.db.patch(contact.listingId, { status: "reached_out" });
    
    return { success: true };
  },
});

/**
 * Mark contact as failed
 */
export const markFailed = mutation({
  args: {
    id: v.id("contacts"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const contact = await ctx.db.get(args.id);
    if (!contact) throw new Error("Contact not found");
    if (contact.userId !== userId) throw new Error("Access denied");
    
    await ctx.db.patch(args.id, {
      status: "failed",
      error: args.error,
    });
    
    return { success: true };
  },
});

/**
 * Record a reply (called by webhook)
 */
export const recordReply = mutation({
  args: {
    threadId: v.string(),
    repliedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Note: This would be called by a webhook, so no auth check
    // In production, verify webhook signature
    
    const contact = await ctx.db
      .query("contacts")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .first();
    
    if (!contact) {
      console.log("No contact found for thread:", args.threadId);
      return { success: false, reason: "Thread not found" };
    }
    
    await ctx.db.patch(contact._id, {
      status: "replied",
      repliedAt: args.repliedAt ?? Date.now(),
    });
    
    // Update listing status
    await ctx.db.patch(contact.listingId, { status: "touring" });
    
    return { success: true };
  },
});

/**
 * Delete a queued contact (before sending)
 */
export const remove = mutation({
  args: { id: v.id("contacts") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const contact = await ctx.db.get(args.id);
    if (!contact) throw new Error("Contact not found");
    if (contact.userId !== userId) throw new Error("Access denied");
    
    if (contact.status !== "queued") {
      throw new Error("Can only delete queued contacts");
    }
    
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
