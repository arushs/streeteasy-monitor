import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const VALID_AUTO_MODES = ["off", "review", "auto"] as const;
const DEFAULT_DAILY_LIMIT = 10;
const MAX_DAILY_LIMIT = 50;

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
 * Get settings for the authenticated user
 */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    
    const settings = await ctx.db
      .query("settings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    // Return defaults if no settings exist
    if (!settings) {
      return {
        userId,
        displayName: null,
        phone: null,
        moveInDate: null,
        leaseTerm: 12,
        autoContactMode: "off",
        dailyLimit: DEFAULT_DAILY_LIMIT,
        maxPrice: null,
        minBedrooms: null,
        maxBedrooms: null,
        noFeeOnly: false,
        neighborhoods: null,
        emailDigest: false,
        pushEnabled: false,
        _isDefault: true, // Indicates these are defaults, not saved
      };
    }
    
    return settings;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Initialize or update settings
 */
export const upsert = mutation({
  args: {
    displayName: v.optional(v.string()),
    phone: v.optional(v.string()),
    moveInDate: v.optional(v.string()),
    leaseTerm: v.optional(v.number()),
    autoContactMode: v.optional(v.string()),
    dailyLimit: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    minBedrooms: v.optional(v.number()),
    maxBedrooms: v.optional(v.number()),
    noFeeOnly: v.optional(v.boolean()),
    neighborhoods: v.optional(v.array(v.string())),
    emailDigest: v.optional(v.boolean()),
    pushEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    // Validate auto contact mode
    const autoContactMode = args.autoContactMode ?? (existing?.autoContactMode || "off");
    if (!VALID_AUTO_MODES.includes(autoContactMode as any)) {
      throw new Error(`autoContactMode must be one of: ${VALID_AUTO_MODES.join(", ")}`);
    }
    
    // Validate daily limit
    let dailyLimit = args.dailyLimit ?? existing?.dailyLimit ?? DEFAULT_DAILY_LIMIT;
    if (dailyLimit < 1 || dailyLimit > MAX_DAILY_LIMIT) {
      throw new Error(`dailyLimit must be between 1 and ${MAX_DAILY_LIMIT}`);
    }
    
    // Validate lease term
    if (args.leaseTerm !== undefined) {
      if (args.leaseTerm < 1 || args.leaseTerm > 36) {
        throw new Error("leaseTerm must be between 1 and 36 months");
      }
    }
    
    // Validate price
    if (args.maxPrice !== undefined && args.maxPrice < 0) {
      throw new Error("maxPrice must be positive");
    }
    
    // Validate bedrooms
    if (args.minBedrooms !== undefined && (args.minBedrooms < 0 || args.minBedrooms > 10)) {
      throw new Error("minBedrooms must be between 0 and 10");
    }
    if (args.maxBedrooms !== undefined && (args.maxBedrooms < 0 || args.maxBedrooms > 10)) {
      throw new Error("maxBedrooms must be between 0 and 10");
    }
    
    // Sanitize strings
    const displayName = args.displayName?.trim().slice(0, 100);
    const phone = args.phone?.replace(/[^\d+\-() ]/g, "").slice(0, 20);
    const moveInDate = args.moveInDate?.trim().slice(0, 20);
    
    const data = {
      userId,
      displayName: displayName ?? existing?.displayName,
      phone: phone ?? existing?.phone,
      moveInDate: moveInDate ?? existing?.moveInDate,
      leaseTerm: args.leaseTerm ?? existing?.leaseTerm ?? 12,
      autoContactMode,
      dailyLimit,
      maxPrice: args.maxPrice ?? existing?.maxPrice,
      minBedrooms: args.minBedrooms ?? existing?.minBedrooms,
      maxBedrooms: args.maxBedrooms ?? existing?.maxBedrooms,
      noFeeOnly: args.noFeeOnly ?? existing?.noFeeOnly ?? false,
      neighborhoods: args.neighborhoods ?? existing?.neighborhoods,
      emailDigest: args.emailDigest ?? existing?.emailDigest ?? false,
      pushEnabled: args.pushEnabled ?? existing?.pushEnabled ?? false,
      updatedAt: Date.now(),
    };
    
    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    } else {
      return await ctx.db.insert("settings", {
        ...data,
        createdAt: Date.now(),
      });
    }
  },
});

/**
 * Update just the profile fields
 */
export const updateProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
    phone: v.optional(v.string()),
    moveInDate: v.optional(v.string()),
    leaseTerm: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (!existing) {
      // Create with defaults
      return await ctx.db.insert("settings", {
        userId,
        displayName: args.displayName?.trim(),
        phone: args.phone?.replace(/[^\d+\-() ]/g, ""),
        moveInDate: args.moveInDate,
        leaseTerm: args.leaseTerm ?? 12,
        autoContactMode: "off",
        dailyLimit: DEFAULT_DAILY_LIMIT,
        createdAt: Date.now(),
      });
    }
    
    const updates: Record<string, any> = { updatedAt: Date.now() };
    
    if (args.displayName !== undefined) {
      updates.displayName = args.displayName.trim().slice(0, 100);
    }
    if (args.phone !== undefined) {
      updates.phone = args.phone.replace(/[^\d+\-() ]/g, "").slice(0, 20);
    }
    if (args.moveInDate !== undefined) {
      updates.moveInDate = args.moveInDate.trim().slice(0, 20);
    }
    if (args.leaseTerm !== undefined) {
      if (args.leaseTerm < 1 || args.leaseTerm > 36) {
        throw new Error("leaseTerm must be between 1 and 36 months");
      }
      updates.leaseTerm = args.leaseTerm;
    }
    
    await ctx.db.patch(existing._id, updates);
    return existing._id;
  },
});

/**
 * Update auto-contact settings
 */
export const updateAutoContact = mutation({
  args: {
    autoContactMode: v.optional(v.string()),
    dailyLimit: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    minBedrooms: v.optional(v.number()),
    maxBedrooms: v.optional(v.number()),
    noFeeOnly: v.optional(v.boolean()),
    neighborhoods: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (!existing) {
      throw new Error("Please set up your profile first");
    }
    
    const updates: Record<string, any> = { updatedAt: Date.now() };
    
    if (args.autoContactMode !== undefined) {
      if (!VALID_AUTO_MODES.includes(args.autoContactMode as any)) {
        throw new Error(`autoContactMode must be one of: ${VALID_AUTO_MODES.join(", ")}`);
      }
      updates.autoContactMode = args.autoContactMode;
    }
    
    if (args.dailyLimit !== undefined) {
      if (args.dailyLimit < 1 || args.dailyLimit > MAX_DAILY_LIMIT) {
        throw new Error(`dailyLimit must be between 1 and ${MAX_DAILY_LIMIT}`);
      }
      updates.dailyLimit = args.dailyLimit;
    }
    
    if (args.maxPrice !== undefined) {
      updates.maxPrice = args.maxPrice > 0 ? args.maxPrice : null;
    }
    
    if (args.minBedrooms !== undefined) {
      updates.minBedrooms = args.minBedrooms >= 0 ? args.minBedrooms : null;
    }
    
    if (args.maxBedrooms !== undefined) {
      updates.maxBedrooms = args.maxBedrooms >= 0 ? args.maxBedrooms : null;
    }
    
    if (args.noFeeOnly !== undefined) {
      updates.noFeeOnly = args.noFeeOnly;
    }
    
    if (args.neighborhoods !== undefined) {
      updates.neighborhoods = args.neighborhoods.length > 0 ? args.neighborhoods : null;
    }
    
    await ctx.db.patch(existing._id, updates);
    return existing._id;
  },
});
