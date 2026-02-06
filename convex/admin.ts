import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// URL validation regex for StreetEasy
const STREETEASY_URL_PATTERN = /^https:\/\/streeteasy\.com\/.+/;

/**
 * Internal function to sanitize existing data
 * Removes entries with XSS attempts or invalid data
 * Run this once via dashboard or internal action
 */
export const sanitizeExistingData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allListings = await ctx.db.query("listings").collect();
    
    const results = {
      total: allListings.length,
      deleted: 0,
      orphaned: 0,
      issues: [] as string[],
    };
    
    for (const listing of allListings) {
      let shouldDelete = false;
      
      // Check for XSS/script injection in URL
      if (listing.streetEasyUrl.includes("<script") || 
          listing.streetEasyUrl.includes("javascript:") ||
          listing.streetEasyUrl.includes("<img") ||
          listing.streetEasyUrl.includes("onerror")) {
        results.issues.push(`XSS attempt in listing ${listing._id}: ${listing.streetEasyUrl.substring(0, 50)}`);
        shouldDelete = true;
      }
      
      // Check for invalid URL format
      if (!STREETEASY_URL_PATTERN.test(listing.streetEasyUrl)) {
        results.issues.push(`Invalid URL in listing ${listing._id}: ${listing.streetEasyUrl.substring(0, 50)}`);
        shouldDelete = true;
      }
      
      // Check for XSS in address
      if (listing.address && (listing.address.includes("<") || listing.address.includes(">"))) {
        results.issues.push(`XSS attempt in address ${listing._id}`);
        shouldDelete = true;
      }
      
      // Check for test data
      if (listing.source === "test") {
        results.issues.push(`Test data in listing ${listing._id}`);
        shouldDelete = true;
      }
      
      // Check for invalid price
      if (listing.price <= 0 || listing.price > 1000000) {
        results.issues.push(`Invalid price in listing ${listing._id}: ${listing.price}`);
        shouldDelete = true;
      }
      
      // Mark listings without userId as orphaned
      if (!listing.userId) {
        results.orphaned++;
      }
      
      if (shouldDelete) {
        await ctx.db.delete(listing._id);
        results.deleted++;
      }
    }
    
    return results;
  },
});

/**
 * Query to check for problematic data without deleting
 * Use this to preview what sanitizeExistingData would remove
 */
export const auditData = query({
  args: {},
  handler: async (ctx) => {
    // This is an admin function - in production you'd want to restrict access
    // For now, require auth at minimum
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }
    
    const allListings = await ctx.db.query("listings").collect();
    
    const issues = [];
    let orphanedCount = 0;
    
    for (const listing of allListings) {
      const listingIssues = [];
      
      // Check for XSS/script injection
      if (listing.streetEasyUrl.includes("<script") || 
          listing.streetEasyUrl.includes("javascript:") ||
          listing.streetEasyUrl.includes("<img")) {
        listingIssues.push("XSS attempt in URL");
      }
      
      // Check for invalid URL
      if (!STREETEASY_URL_PATTERN.test(listing.streetEasyUrl)) {
        listingIssues.push("Invalid StreetEasy URL");
      }
      
      // Check for test data
      if (listing.source === "test") {
        listingIssues.push("Test data");
      }
      
      // Check for invalid price
      if (listing.price <= 0 || listing.price > 1000000) {
        listingIssues.push(`Invalid price: ${listing.price}`);
      }
      
      // Check for missing userId
      if (!listing.userId) {
        listingIssues.push("Missing userId (orphaned)");
        orphanedCount++;
      }
      
      if (listingIssues.length > 0) {
        issues.push({
          id: listing._id,
          url: listing.streetEasyUrl.substring(0, 60),
          issues: listingIssues,
        });
      }
    }
    
    return {
      totalListings: allListings.length,
      issueCount: issues.length,
      orphanedCount,
      issues,
    };
  },
});

/**
 * Import listings from email forwarding system
 * NO AUTH - called by system with API key validation
 */
export const importFromEmail = mutation({
  args: {
    forwarderEmail: v.string(),
    apiKey: v.string(),
    listings: v.array(v.object({
      streetEasyUrl: v.string(),
      price: v.number(),
      address: v.optional(v.string()),
      bedrooms: v.optional(v.number()),
      neighborhood: v.optional(v.string()),
      noFee: v.optional(v.boolean()),
    })),
  },
  handler: async (ctx, args) => {
    // Validate API key
    const expectedApiKey = process.env.IMPORT_API_KEY;
    if (!expectedApiKey) {
      throw new Error("Import API key not configured");
    }
    if (args.apiKey !== expectedApiKey) {
      throw new Error("Invalid API key");
    }

    // Look up user by forwarder email
    const userEmail = await ctx.db
      .query("userEmails")
      .withIndex("by_email", (q) => q.eq("email", args.forwarderEmail))
      .first();

    const userId = userEmail?.userId; // Will be undefined if no user found

    const results = {
      total: args.listings.length,
      inserted: 0,
      skipped: 0,
      errors: [] as string[],
      orphaned: userId ? false : true,
    };

    // Process each listing
    for (const listing of args.listings) {
      try {
        // Validate StreetEasy URL
        if (!STREETEASY_URL_PATTERN.test(listing.streetEasyUrl)) {
          results.errors.push(`Invalid StreetEasy URL: ${listing.streetEasyUrl}`);
          results.skipped++;
          continue;
        }

        // Check for duplicate (same URL for same user, or same URL if no user)
        const existingQuery = userId
          ? ctx.db.query("listings")
              .withIndex("by_user_url", (q) => q.eq("userId", userId).eq("streetEasyUrl", listing.streetEasyUrl))
          : ctx.db.query("listings")
              .filter((q) => q.and(
                q.eq(q.field("streetEasyUrl"), listing.streetEasyUrl),
                q.eq(q.field("userId"), undefined)
              ));

        const existing = await existingQuery.first();
        if (existing) {
          results.skipped++;
          continue;
        }

        // Insert the listing
        await ctx.db.insert("listings", {
          streetEasyUrl: listing.streetEasyUrl,
          price: listing.price,
          source: "email",
          status: "new",
          foundAt: Date.now(),
          address: listing.address,
          bedrooms: listing.bedrooms,
          neighborhood: listing.neighborhood,
          noFee: listing.noFee,
          userId, // Will be undefined if no user found (orphaned)
        });

        results.inserted++;
      } catch (error) {
        results.errors.push(`Error processing ${listing.streetEasyUrl}: ${error}`);
        results.skipped++;
      }
    }

    return results;
  },
});
