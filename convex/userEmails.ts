import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Add email to user account (requires auth)
export const add = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    // Check if email already exists
    const existing = await ctx.db
      .query("userEmails")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      throw new Error("Email already linked to an account");
    }

    // Add the email
    const id = await ctx.db.insert("userEmails", {
      userId,
      email: args.email,
      verified: false, // Initially unverified
      createdAt: Date.now(),
    });

    return { id, email: args.email };
  },
});

// Get user's linked emails
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    return await ctx.db
      .query("userEmails")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Remove a linked email
export const remove = mutation({
  args: {
    emailId: v.id("userEmails"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const userEmail = await ctx.db.get(args.emailId);
    if (!userEmail) {
      throw new Error("Email not found");
    }

    if (userEmail.userId !== userId) {
      throw new Error("Not authorized to remove this email");
    }

    await ctx.db.delete(args.emailId);
    return { success: true };
  },
});

// Internal: find userId by email (for import)
export const getByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const userEmail = await ctx.db
      .query("userEmails")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    return userEmail ? { userId: userEmail.userId } : null;
  },
});