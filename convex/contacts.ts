import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {
    userId: v.optional(v.string()),
    listingId: v.optional(v.id("listings")),
  },
  handler: async (ctx, args) => {
    if (args.listingId) {
      return await ctx.db
        .query("contacts")
        .withIndex("by_listing", (q) => q.eq("listingId", args.listingId!))
        .collect();
    }
    if (args.userId) {
      return await ctx.db
        .query("contacts")
        .withIndex("by_user", (q) => q.eq("userId", args.userId!))
        .collect();
    }
    return await ctx.db.query("contacts").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    notes: v.optional(v.string()),
    listingId: v.optional(v.id("listings")),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("contacts", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("contacts"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    notes: v.optional(v.string()),
    listingId: v.optional(v.id("listings")),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
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
  args: { id: v.id("contacts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
