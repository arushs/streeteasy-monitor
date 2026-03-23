import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  listings: defineTable({
    streetEasyUrl: v.string(),
    price: v.number(),
    source: v.union(v.literal("manual"), v.literal("email"), v.literal("test")),
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
    foundAt: v.number(),
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
    previousPrice: v.optional(v.number()),
    lastCheckedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_neighborhood", ["neighborhood"])
    .index("by_found_at", ["foundAt"])
    .index("by_email_message_id", ["emailMessageId"]),

  listing_changes: defineTable({
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
    detectedAt: v.number(),
    readAt: v.optional(v.number()),
  })
    .index("by_listing", ["listingId"])
    .index("by_type", ["changeType"])
    .index("by_unread", ["readAt"]),

  contacts: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    notes: v.optional(v.string()),
    listingId: v.optional(v.id("listings")),
    userId: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_listing", ["listingId"]),

  settings: defineTable({
    key: v.string(),
    value: v.string(),
    userId: v.optional(v.string()),
  })
    .index("by_key", ["key"])
    .index("by_user_key", ["userId", "key"]),

  user_emails: defineTable({
    userId: v.string(),
    email: v.string(),
    verified: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_email", ["email"]),
});
