import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Valid status values
const VALID_STATUSES = ["new", "viewed", "saved", "rejected", "applied"] as const;
type ListingStatus = typeof VALID_STATUSES[number];

// Valid source values
const VALID_SOURCES = ["manual", "email", "test"] as const;
type ListingSource = typeof VALID_SOURCES[number];

// URL validation regex for StreetEasy
const STREETEASY_URL_PATTERN = /^https:\/\/streeteasy\.com\/.+/;

/**
 * Helper to get authenticated user ID or throw
 */
async function requireAuth(ctx: { auth: { getUserIdentity: () => Promise<any> } }): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Authentication required. Please sign in to access this resource.");
  }
  return identity.subject;
}

/**
 * Validate StreetEasy URL format
 */
function validateStreetEasyUrl(url: string): void {
  if (!url || typeof url !== "string") {
    throw new Error("streetEasyUrl is required and must be a string");
  }
  if (!STREETEASY_URL_PATTERN.test(url)) {
    throw new Error("streetEasyUrl must be a valid StreetEasy URL (https://streeteasy.com/...)");
  }
  // Sanitize: check for script injection attempts
  if (url.includes("<") || url.includes(">") || url.includes("javascript:")) {
    throw new Error("Invalid characters in URL");
  }
}

/**
 * Validate price is a positive number
 */
function validatePrice(price: number): void {
  if (typeof price !== "number" || !Number.isFinite(price)) {
    throw new Error("price must be a valid number");
  }
  if (price <= 0) {
    throw new Error("price must be a positive number");
  }
  if (price > 1000000) {
    throw new Error("price seems unreasonably high (max: $1,000,000/month)");
  }
}

/**
 * Validate status is one of the allowed values
 */
function validateStatus(status: string): asserts status is ListingStatus {
  if (!VALID_STATUSES.includes(status as ListingStatus)) {
    throw new Error(`status must be one of: ${VALID_STATUSES.join(", ")}`);
  }
}

/**
 * Validate source is one of the allowed values
 */
function validateSource(source: string): asserts source is ListingSource {
  if (!VALID_SOURCES.includes(source as ListingSource)) {
    throw new Error(`source must be one of: ${VALID_SOURCES.join(", ")}`);
  }
}

/**
 * Sanitize optional string fields
 */
function sanitizeString(value: string | undefined, fieldName: string, maxLength = 500): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string`);
  }
  // Strip HTML/script tags
  const sanitized = value.replace(/<[^>]*>/g, "").trim();
  if (sanitized.length > maxLength) {
    throw new Error(`${fieldName} exceeds maximum length of ${maxLength} characters`);
  }
  return sanitized;
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get all listings for the authenticated user
 */
export const list = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    if (args.status) {
      validateStatus(args.status);
      return await ctx.db
        .query("listings")
        .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", args.status!))
        .order("desc")
        .collect();
    }
    
    return await ctx.db
      .query("listings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

/**
 * Get a single listing by ID (must belong to authenticated user)
 */
export const get = query({
  args: {
    id: v.id("listings"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const listing = await ctx.db.get(args.id);
    if (!listing) {
      throw new Error("Listing not found");
    }
    if (listing.userId !== userId) {
      throw new Error("Access denied: this listing belongs to another user");
    }
    
    return listing;
  },
});

/**
 * Get listing stats for the authenticated user
 */
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    
    const listings = await ctx.db
      .query("listings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    const stats = {
      total: listings.length,
      byStatus: {} as Record<string, number>,
      bySource: {} as Record<string, number>,
    };
    
    for (const listing of listings) {
      stats.byStatus[listing.status] = (stats.byStatus[listing.status] || 0) + 1;
      stats.bySource[listing.source] = (stats.bySource[listing.source] || 0) + 1;
    }
    
    return stats;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new listing
 */
export const create = mutation({
  args: {
    streetEasyUrl: v.string(),
    price: v.number(),
    source: v.optional(v.string()),
    status: v.optional(v.string()),
    address: v.optional(v.string()),
    bedrooms: v.optional(v.number()),
    neighborhood: v.optional(v.string()),
    noFee: v.optional(v.boolean()),
    emailMessageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    // Validate required fields
    validateStreetEasyUrl(args.streetEasyUrl);
    validatePrice(args.price);
    
    // Validate optional fields with defaults
    const source = args.source || "manual";
    const status = args.status || "new";
    validateSource(source);
    validateStatus(status);
    
    // Check for duplicate URL for this user
    const existing = await ctx.db
      .query("listings")
      .withIndex("by_user_url", (q) => q.eq("userId", userId).eq("streetEasyUrl", args.streetEasyUrl))
      .first();
    
    if (existing) {
      throw new Error("You already have a listing with this URL");
    }
    
    // Sanitize optional string fields
    const address = sanitizeString(args.address, "address", 200);
    const neighborhood = sanitizeString(args.neighborhood, "neighborhood", 100);
    const emailMessageId = sanitizeString(args.emailMessageId, "emailMessageId", 100);
    
    // Validate bedrooms if provided
    if (args.bedrooms !== undefined) {
      if (!Number.isInteger(args.bedrooms) || args.bedrooms < 0 || args.bedrooms > 20) {
        throw new Error("bedrooms must be a non-negative integer (max 20)");
      }
    }
    
    return await ctx.db.insert("listings", {
      streetEasyUrl: args.streetEasyUrl,
      price: args.price,
      source,
      status,
      foundAt: Date.now(),
      address,
      bedrooms: args.bedrooms,
      neighborhood,
      noFee: args.noFee,
      emailMessageId,
      userId,
    });
  },
});

/**
 * Update listing status
 */
export const updateStatus = mutation({
  args: {
    id: v.id("listings"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    validateStatus(args.status);
    
    const listing = await ctx.db.get(args.id);
    if (!listing) {
      throw new Error("Listing not found");
    }
    if (listing.userId !== userId) {
      throw new Error("Access denied: you can only update your own listings");
    }
    
    await ctx.db.patch(args.id, { status: args.status });
    return { success: true };
  },
});

/**
 * Update listing details
 */
export const update = mutation({
  args: {
    id: v.id("listings"),
    streetEasyUrl: v.optional(v.string()),
    price: v.optional(v.number()),
    status: v.optional(v.string()),
    address: v.optional(v.string()),
    bedrooms: v.optional(v.number()),
    neighborhood: v.optional(v.string()),
    noFee: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const listing = await ctx.db.get(args.id);
    if (!listing) {
      throw new Error("Listing not found");
    }
    if (listing.userId !== userId) {
      throw new Error("Access denied: you can only update your own listings");
    }
    
    const updates: Record<string, any> = {};
    
    if (args.streetEasyUrl !== undefined) {
      validateStreetEasyUrl(args.streetEasyUrl);
      // Check for duplicate if URL is changing
      if (args.streetEasyUrl !== listing.streetEasyUrl) {
        const existing = await ctx.db
          .query("listings")
          .withIndex("by_user_url", (q) => q.eq("userId", userId).eq("streetEasyUrl", args.streetEasyUrl!))
          .first();
        if (existing) {
          throw new Error("You already have a listing with this URL");
        }
      }
      updates.streetEasyUrl = args.streetEasyUrl;
    }
    
    if (args.price !== undefined) {
      validatePrice(args.price);
      updates.price = args.price;
    }
    
    if (args.status !== undefined) {
      validateStatus(args.status);
      updates.status = args.status;
    }
    
    if (args.address !== undefined) {
      updates.address = sanitizeString(args.address, "address", 200);
    }
    
    if (args.neighborhood !== undefined) {
      updates.neighborhood = sanitizeString(args.neighborhood, "neighborhood", 100);
    }
    
    if (args.bedrooms !== undefined) {
      if (!Number.isInteger(args.bedrooms) || args.bedrooms < 0 || args.bedrooms > 20) {
        throw new Error("bedrooms must be a non-negative integer (max 20)");
      }
      updates.bedrooms = args.bedrooms;
    }
    
    if (args.noFee !== undefined) {
      updates.noFee = args.noFee;
    }
    
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.id, updates);
    }
    
    return { success: true };
  },
});

/**
 * Delete a listing
 */
export const remove = mutation({
  args: {
    id: v.id("listings"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const listing = await ctx.db.get(args.id);
    if (!listing) {
      throw new Error("Listing not found");
    }
    if (listing.userId !== userId) {
      throw new Error("Access denied: you can only delete your own listings");
    }
    
    await ctx.db.delete(args.id);
    return { success: true, deletedId: args.id };
  },
});
