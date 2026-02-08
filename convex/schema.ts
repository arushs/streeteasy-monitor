import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  
  listings: defineTable({
    streetEasyUrl: v.string(),
    price: v.number(),
    source: v.string(), // "manual" | "email" | "test"
    status: v.string(), // "new" | "interested" | "reached_out" | "touring" | "applied" | "rejected"
    foundAt: v.number(),
    address: v.optional(v.string()),
    bedrooms: v.optional(v.number()),
    bathrooms: v.optional(v.number()), // Existing data has this field
    sqft: v.optional(v.number()), // Existing data has this field  
    neighborhood: v.optional(v.string()),
    noFee: v.optional(v.boolean()),
    emailMessageId: v.optional(v.string()),
    // userId is optional for backward compatibility with existing data
    // New listings will always have userId set
    // Listings without userId are considered "orphaned" and won't appear in user queries
    userId: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_user_url", ["userId", "streetEasyUrl"]),

  userEmails: defineTable({
    userId: v.string(),           // From Convex Auth identity.subject
    email: v.string(),            // The forwarding email (e.g. arush@gmail.com)
    verified: v.boolean(),        // Has been confirmed
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_email", ["email"]),
});
