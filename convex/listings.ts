import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ── Queries ────────────────────────────────────────────────────────

export const list = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("new"),
        v.literal("viewed"),
        v.literal("interested"),
        v.literal("rejected"),
        v.literal("reached_out"),
        v.literal("applied"),
        v.literal("rented"),
        v.literal("delisted"),
        v.literal("removed")
      )
    ),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.status && args.userId) {
      return await ctx.db
        .query("listings")
        .withIndex("by_user_status", (q) =>
          q.eq("userId", args.userId!).eq("status", args.status!)
        )
        .order("desc")
        .collect();
    }
    if (args.status) {
      return await ctx.db
        .query("listings")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    }
    if (args.userId) {
      return await ctx.db
        .query("listings")
        .withIndex("by_user", (q) => q.eq("userId", args.userId!))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("listings").order("desc").collect();
  },
});

export const get = query({
  args: { id: v.id("listings") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const stats = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const all = args.userId
      ? await ctx.db
          .query("listings")
          .withIndex("by_user", (q) => q.eq("userId", args.userId!))
          .collect()
      : await ctx.db.query("listings").collect();

    const byStatus: Record<string, number> = {};
    for (const l of all) {
      byStatus[l.status] = (byStatus[l.status] || 0) + 1;
    }
    return { total: all.length, byStatus };
  },
});

// ── Mutations ──────────────────────────────────────────────────────

export const create = mutation({
  args: {
    streetEasyUrl: v.string(),
    price: v.number(),
    source: v.optional(
      v.union(v.literal("manual"), v.literal("email"), v.literal("test"))
    ),
    status: v.optional(
      v.union(
        v.literal("new"),
        v.literal("viewed"),
        v.literal("interested"),
        v.literal("rejected"),
        v.literal("reached_out"),
        v.literal("applied")
      )
    ),
    foundAt: v.optional(v.number()),
    address: v.optional(v.string()),
    bedrooms: v.optional(v.number()),
    bathrooms: v.optional(v.number()),
    sqft: v.optional(v.number()),
    neighborhood: v.optional(v.string()),
    noFee: v.optional(v.boolean()),
    imageUrl: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    emailMessageId: v.optional(v.string()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Deduplicate by streetEasyUrl
    const existing = await ctx.db
      .query("listings")
      .filter((q) => q.eq(q.field("streetEasyUrl"), args.streetEasyUrl))
      .first();
    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("listings", {
      streetEasyUrl: args.streetEasyUrl,
      price: args.price,
      source: args.source ?? "manual",
      status: args.status ?? "new",
      foundAt: args.foundAt ?? Math.floor(Date.now() / 1000),
      address: args.address,
      bedrooms: args.bedrooms,
      bathrooms: args.bathrooms,
      sqft: args.sqft,
      neighborhood: args.neighborhood,
      noFee: args.noFee,
      imageUrl: args.imageUrl,
      images: args.images,
      emailMessageId: args.emailMessageId,
      userId: args.userId,
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("listings"),
    status: v.union(
      v.literal("new"),
      v.literal("viewed"),
      v.literal("interested"),
      v.literal("rejected"),
      v.literal("reached_out"),
      v.literal("applied"),
      v.literal("rented"),
      v.literal("delisted"),
      v.literal("removed")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const update = mutation({
  args: {
    id: v.id("listings"),
    streetEasyUrl: v.optional(v.string()),
    price: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("new"),
        v.literal("viewed"),
        v.literal("interested"),
        v.literal("rejected"),
        v.literal("reached_out"),
        v.literal("applied"),
        v.literal("rented"),
        v.literal("delisted"),
        v.literal("removed")
      )
    ),
    address: v.optional(v.string()),
    bedrooms: v.optional(v.number()),
    bathrooms: v.optional(v.number()),
    sqft: v.optional(v.number()),
    neighborhood: v.optional(v.string()),
    noFee: v.optional(v.boolean()),
    imageUrl: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    previousPrice: v.optional(v.number()),
    lastCheckedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    // Remove undefined fields
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(fields)) {
      if (val !== undefined) patch[k] = val;
    }
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(id, patch);
    }
  },
});

export const remove = mutation({
  args: { id: v.id("listings") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
