import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {
    listingId: v.optional(v.id("listings")),
    changeType: v.optional(
      v.union(
        v.literal("price_drop"),
        v.literal("price_increase"),
        v.literal("rented"),
        v.literal("delisted"),
        v.literal("removed"),
        v.literal("became_no_fee"),
        v.literal("lost_no_fee")
      )
    ),
    unreadOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results;
    if (args.listingId) {
      results = await ctx.db
        .query("listing_changes")
        .withIndex("by_listing", (idx) => idx.eq("listingId", args.listingId!))
        .order("desc")
        .collect();
    } else {
      results = await ctx.db
        .query("listing_changes")
        .order("desc")
        .collect();
    }

    if (args.changeType) {
      results = results.filter((c) => c.changeType === args.changeType);
    }
    if (args.unreadOnly) {
      results = results.filter((c) => c.readAt === undefined);
    }

    const limit = args.limit ?? 100;
    return results.slice(0, limit);
  },
});

export const summary = query({
  args: { sinceSecs: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const since = args.sinceSecs ?? Math.floor(Date.now() / 1000) - 86400;
    const all = await ctx.db.query("listing_changes").collect();

    const recent = all.filter((c) => c.detectedAt >= since);
    const byType: Record<string, number> = {};
    for (const c of recent) {
      byType[c.changeType] = (byType[c.changeType] || 0) + 1;
    }

    const unread = all.filter((c) => c.readAt === undefined).length;
    return { changes: byType, unread };
  },
});

export const create = mutation({
  args: {
    listingId: v.id("listings"),
    changeType: v.union(
      v.literal("price_drop"),
      v.literal("price_increase"),
      v.literal("rented"),
      v.literal("delisted"),
      v.literal("removed"),
      v.literal("became_no_fee"),
      v.literal("lost_no_fee")
    ),
    oldValue: v.optional(v.string()),
    newValue: v.optional(v.string()),
    detectedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("listing_changes", {
      listingId: args.listingId,
      changeType: args.changeType,
      oldValue: args.oldValue,
      newValue: args.newValue,
      detectedAt: args.detectedAt ?? Math.floor(Date.now() / 1000),
    });
  },
});

export const markRead = mutation({
  args: {
    ids: v.optional(v.array(v.id("listing_changes"))),
  },
  handler: async (ctx, args) => {
    const now = Math.floor(Date.now() / 1000);
    if (args.ids) {
      for (const id of args.ids) {
        await ctx.db.patch(id, { readAt: now });
      }
    } else {
      // Mark all as read
      const unread = await ctx.db
        .query("listing_changes")
        .filter((q) => q.eq(q.field("readAt"), undefined))
        .collect();
      for (const c of unread) {
        await ctx.db.patch(c._id, { readAt: now });
      }
    }
  },
});
