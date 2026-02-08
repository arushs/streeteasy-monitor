import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

/**
 * Internal mutation to create a listing from email ingestion
 * Called by the HTTP webhook handler
 */
export const createListing = internalMutation({
  args: {
    userId: v.string(),
    streetEasyUrl: v.string(),
    price: v.number(),
    address: v.optional(v.string()),
    bedrooms: v.optional(v.number()),
    neighborhood: v.optional(v.string()),
    noFee: v.optional(v.boolean()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate URL
    if (!args.streetEasyUrl.startsWith("https://streeteasy.com/")) {
      throw new Error("Invalid StreetEasy URL");
    }
    
    // Validate price (use a reasonable default if missing/invalid)
    let price = args.price;
    if (!price || price <= 0) {
      price = 0; // Will be filled in later or manually
    }
    if (price > 1000000) {
      throw new Error("Price seems unreasonably high");
    }
    
    // Check for duplicate
    const existing = await ctx.db
      .query("listings")
      .withIndex("by_user_url", (q) => 
        q.eq("userId", args.userId).eq("streetEasyUrl", args.streetEasyUrl)
      )
      .first();
    
    if (existing) {
      throw new Error("User already has a listing with this URL");
    }
    
    // Validate bedrooms
    let bedrooms = args.bedrooms;
    if (bedrooms !== undefined && (bedrooms < 0 || bedrooms > 20)) {
      bedrooms = undefined;
    }
    
    // Sanitize strings
    const sanitize = (s: string | undefined, max = 200) => 
      s?.replace(/<[^>]+>/g, "").trim().slice(0, max);
    
    return await ctx.db.insert("listings", {
      userId: args.userId,
      streetEasyUrl: args.streetEasyUrl,
      price,
      source: "email",
      status: "new",
      foundAt: Date.now(),
      address: sanitize(args.address),
      bedrooms,
      neighborhood: sanitize(args.neighborhood, 100),
      noFee: args.noFee,
      imageUrl: sanitize(args.imageUrl, 500),
    });
  },
});

/**
 * Internal query to look up user by their registered email
 */
export const getUserByEmail = internalQuery({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const userEmail = await ctx.db
      .query("userEmails")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();
    
    return userEmail ? { userId: userEmail.userId, verified: userEmail.verified } : null;
  },
});

/**
 * Batch create listings (for bulk import)
 */
export const batchCreateListings = internalMutation({
  args: {
    userId: v.string(),
    listings: v.array(v.object({
      streetEasyUrl: v.string(),
      price: v.number(),
      address: v.optional(v.string()),
      bedrooms: v.optional(v.number()),
      neighborhood: v.optional(v.string()),
      noFee: v.optional(v.boolean()),
      imageUrl: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    let created = 0;
    let skipped = 0;
    const errors: string[] = [];
    
    for (const listing of args.listings) {
      // Check for duplicate
      const existing = await ctx.db
        .query("listings")
        .withIndex("by_user_url", (q) => 
          q.eq("userId", args.userId).eq("streetEasyUrl", listing.streetEasyUrl)
        )
        .first();
      
      if (existing) {
        skipped++;
        continue;
      }
      
      try {
        await ctx.db.insert("listings", {
          userId: args.userId,
          streetEasyUrl: listing.streetEasyUrl,
          price: listing.price || 0,
          source: "email",
          status: "new",
          foundAt: Date.now(),
          address: listing.address,
          bedrooms: listing.bedrooms,
          neighborhood: listing.neighborhood,
          noFee: listing.noFee,
          imageUrl: listing.imageUrl,
        });
        created++;
      } catch (e: any) {
        errors.push(`${listing.streetEasyUrl}: ${e.message}`);
      }
    }
    
    return { created, skipped, errors };
  },
});

/**
 * Mark email as processed (for deduplication)
 */
export const markEmailProcessed = internalMutation({
  args: {
    messageId: v.string(),
    userId: v.string(),
    listingsCreated: v.number(),
  },
  handler: async (ctx, args) => {
    // Could store in a separate table for audit/dedup
    // For now just log
    console.log(`Email ${args.messageId} processed for user ${args.userId}: ${args.listingsCreated} listings`);
    return { success: true };
  },
});
