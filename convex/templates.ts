import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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
 * Get all templates for the authenticated user (including system templates)
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    
    const userTemplates = await ctx.db
      .query("templates")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    // Sort: default first, then by name
    return userTemplates.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return a.name.localeCompare(b.name);
    });
  },
});

/**
 * Get the default template for the user
 */
export const getDefault = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    
    const defaultTemplate = await ctx.db
      .query("templates")
      .withIndex("by_user_default", (q) => q.eq("userId", userId).eq("isDefault", true))
      .first();
    
    return defaultTemplate;
  },
});

/**
 * Get a single template by ID
 */
export const get = query({
  args: { id: v.id("templates") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const template = await ctx.db.get(args.id);
    if (!template) {
      throw new Error("Template not found");
    }
    if (template.userId !== userId && !template.isSystem) {
      throw new Error("Access denied");
    }
    
    return template;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new template
 */
export const create = mutation({
  args: {
    name: v.string(),
    subject: v.string(),
    body: v.string(),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    // Validate
    if (!args.name.trim()) throw new Error("Name is required");
    if (!args.subject.trim()) throw new Error("Subject is required");
    if (!args.body.trim()) throw new Error("Body is required");
    if (args.name.length > 100) throw new Error("Name too long");
    if (args.subject.length > 200) throw new Error("Subject too long");
    if (args.body.length > 5000) throw new Error("Body too long");
    
    const isDefault = args.isDefault ?? false;
    
    // If setting as default, unset other defaults
    if (isDefault) {
      const existingDefault = await ctx.db
        .query("templates")
        .withIndex("by_user_default", (q) => q.eq("userId", userId).eq("isDefault", true))
        .first();
      
      if (existingDefault) {
        await ctx.db.patch(existingDefault._id, { isDefault: false });
      }
    }
    
    return await ctx.db.insert("templates", {
      userId,
      name: args.name.trim(),
      subject: args.subject.trim(),
      body: args.body.trim(),
      isDefault,
      createdAt: Date.now(),
    });
  },
});

/**
 * Update a template
 */
export const update = mutation({
  args: {
    id: v.id("templates"),
    name: v.optional(v.string()),
    subject: v.optional(v.string()),
    body: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const template = await ctx.db.get(args.id);
    if (!template) throw new Error("Template not found");
    if (template.userId !== userId) throw new Error("Access denied");
    if (template.isSystem) throw new Error("Cannot edit system templates");
    
    const updates: Record<string, any> = { updatedAt: Date.now() };
    
    if (args.name !== undefined) {
      if (!args.name.trim()) throw new Error("Name is required");
      if (args.name.length > 100) throw new Error("Name too long");
      updates.name = args.name.trim();
    }
    
    if (args.subject !== undefined) {
      if (!args.subject.trim()) throw new Error("Subject is required");
      if (args.subject.length > 200) throw new Error("Subject too long");
      updates.subject = args.subject.trim();
    }
    
    if (args.body !== undefined) {
      if (!args.body.trim()) throw new Error("Body is required");
      if (args.body.length > 5000) throw new Error("Body too long");
      updates.body = args.body.trim();
    }
    
    if (args.isDefault !== undefined) {
      if (args.isDefault && !template.isDefault) {
        // Unset other defaults
        const existingDefault = await ctx.db
          .query("templates")
          .withIndex("by_user_default", (q) => q.eq("userId", userId).eq("isDefault", true))
          .first();
        
        if (existingDefault && existingDefault._id !== args.id) {
          await ctx.db.patch(existingDefault._id, { isDefault: false });
        }
      }
      updates.isDefault = args.isDefault;
    }
    
    await ctx.db.patch(args.id, updates);
    return { success: true };
  },
});

/**
 * Delete a template
 */
export const remove = mutation({
  args: { id: v.id("templates") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const template = await ctx.db.get(args.id);
    if (!template) throw new Error("Template not found");
    if (template.userId !== userId) throw new Error("Access denied");
    if (template.isSystem) throw new Error("Cannot delete system templates");
    
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Create default system template for a new user
 */
export const createDefaultTemplate = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    
    // Check if user already has templates
    const existing = await ctx.db
      .query("templates")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (existing) return existing._id;
    
    // Create default template
    return await ctx.db.insert("templates", {
      userId,
      name: "Standard Inquiry",
      subject: "Inquiry about {{address}}",
      body: `Hi,

I'm interested in the apartment at {{address}} listed for {{price}}/month.

I'm looking to move in around {{moveInDate}} for a {{leaseTerm}}-month lease. I have excellent credit and stable income.

Would it be possible to schedule a viewing this week?

Best regards,
{{name}}
{{phone}}`,
      isDefault: true,
      createdAt: Date.now(),
    });
  },
});

/**
 * Fill template variables with actual values
 */
export const fillTemplate = query({
  args: {
    templateId: v.id("templates"),
    listingId: v.id("listings"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found");
    
    const listing = await ctx.db.get(args.listingId);
    if (!listing) throw new Error("Listing not found");
    if (listing.userId !== userId) throw new Error("Access denied");
    
    // Get user settings for name, phone, etc.
    const settings = await ctx.db
      .query("settings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    // Variable substitution
    const variables: Record<string, string> = {
      address: listing.address || "the listing",
      price: listing.price ? `$${listing.price.toLocaleString()}` : "the listed price",
      neighborhood: listing.neighborhood || "",
      bedrooms: listing.bedrooms?.toString() || "",
      name: settings?.displayName || "Your Name",
      phone: settings?.phone || "",
      moveInDate: settings?.moveInDate || "ASAP",
      leaseTerm: settings?.leaseTerm?.toString() || "12",
    };
    
    let subject = template.subject;
    let body = template.body;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "gi");
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    }
    
    return { subject, body };
  },
});
