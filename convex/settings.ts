import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {
    userId: v.optional(v.string()),
    key: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.userId && args.key) {
      return await ctx.db
        .query("settings")
        .withIndex("by_user_key", (q) =>
          q.eq("userId", args.userId!).eq("key", args.key!)
        )
        .collect();
    }
    if (args.userId) {
      return await ctx.db
        .query("settings")
        .withIndex("by_user_key", (q) => q.eq("userId", args.userId!))
        .collect();
    }
    return await ctx.db.query("settings").collect();
  },
});

export const upsert = mutation({
  args: {
    key: v.string(),
    value: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Upsert by key + userId
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_user_key", (q) =>
        q.eq("userId", args.userId).eq("key", args.key)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value });
      return existing._id;
    }

    return await ctx.db.insert("settings", args);
  },
});

export const remove = mutation({
  args: { id: v.id("settings") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
