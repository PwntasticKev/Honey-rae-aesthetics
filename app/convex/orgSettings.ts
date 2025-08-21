import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

// Define the org settings schema for workflow variables
const workflowVariablesSchema = v.object({
  // Business information
  business_name: v.optional(v.string()),
  business_phone: v.optional(v.string()),
  business_email: v.optional(v.string()),
  business_address: v.optional(v.string()),

  // Booking and review links
  booking_link: v.optional(v.string()),
  google_review_link: v.optional(v.string()),
  website_url: v.optional(v.string()),

  // Social media links
  instagram_link: v.optional(v.string()),
  facebook_link: v.optional(v.string()),

  // Custom variables (key-value pairs)
  custom_variables: v.optional(
    v.array(
      v.object({
        key: v.string(),
        value: v.string(),
        description: v.optional(v.string()),
      }),
    ),
  ),
});

// Get org settings including workflow variables
export const getOrgSettings = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.orgId);
    if (!org) throw new Error("Organization not found");

    // Get or create default workflow variables
    const defaultVariables = {
      business_name: org.name || "Our Clinic",
      business_phone: "(555) 123-4567",
      business_email: "info@clinic.com",
      business_address: "123 Beauty St, Clinic City, ST 12345",
      booking_link: "https://book.clinic.com",
      google_review_link: "https://g.page/r/YourBusinessReviewLink",
      website_url: "https://clinic.com",
      instagram_link: "https://instagram.com/yourclinic",
      facebook_link: "https://facebook.com/yourclinic",
      custom_variables: [
        {
          key: "cancellation_policy",
          value: "24 hours advance notice required",
          description: "Your cancellation policy text",
        },
        {
          key: "emergency_contact",
          value: "(555) 999-HELP",
          description: "Emergency contact number",
        },
      ],
    };

    return {
      org,
      workflowVariables: org.workflowVariables || defaultVariables,
      availableVariables: getAvailableVariablesHelper(),
    };
  },
});

// Update org workflow variables
export const updateWorkflowVariables = mutation({
  args: {
    orgId: v.id("orgs"),
    workflowVariables: workflowVariablesSchema,
  },
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.orgId);
    if (!org) throw new Error("Organization not found");

    await ctx.db.patch(args.orgId, {
      workflowVariables: args.workflowVariables,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get all available variables for reference
export const getAvailableVariables = query({
  args: {},
  handler: async () => {
    return getAvailableVariablesHelper();
  },
});

// Helper function to get available variables
function getAvailableVariablesHelper() {
  return {
    clientVariables: [
      { key: "{{first_name}}", description: "Client's first name" },
      { key: "{{last_name}}", description: "Client's last name" },
      { key: "{{client_name}}", description: "Client's full name" },
      { key: "{{email}}", description: "Client's email address" },
      { key: "{{phone}}", description: "Client's phone number" },
    ],
    appointmentVariables: [
      { key: "{{appointment_date}}", description: "Appointment date" },
      { key: "{{appointment_time}}", description: "Appointment time" },
      {
        key: "{{appointment_type}}",
        description: "Type of appointment/treatment",
      },
      { key: "{{provider}}", description: "Provider/staff member name" },
    ],
    businessVariables: [
      { key: "{{business_name}}", description: "Your business name" },
      { key: "{{business_phone}}", description: "Your business phone number" },
      { key: "{{business_email}}", description: "Your business email" },
      { key: "{{business_address}}", description: "Your business address" },
      { key: "{{booking_link}}", description: "Online booking link" },
      { key: "{{google_review_link}}", description: "Google review link" },
      { key: "{{website_url}}", description: "Your website URL" },
      { key: "{{instagram_link}}", description: "Instagram profile link" },
      { key: "{{facebook_link}}", description: "Facebook page link" },
    ],
    customVariables: [
      {
        key: "{{cancellation_policy}}",
        description: "Your cancellation policy",
      },
      {
        key: "{{emergency_contact}}",
        description: "Emergency contact information",
      },
    ],
  };
}

// Add a new custom variable
export const addCustomVariable = mutation({
  args: {
    orgId: v.id("orgs"),
    key: v.string(),
    value: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.orgId);
    if (!org) throw new Error("Organization not found");

    const currentVariables = org.workflowVariables || { custom_variables: [] };
    const customVariables = currentVariables.custom_variables || [];

    // Check if variable already exists
    const existingIndex = customVariables.findIndex((v) => v.key === args.key);

    if (existingIndex >= 0) {
      // Update existing variable
      customVariables[existingIndex] = {
        key: args.key,
        value: args.value,
        description: args.description,
      };
    } else {
      // Add new variable
      customVariables.push({
        key: args.key,
        value: args.value,
        description: args.description,
      });
    }

    await ctx.db.patch(args.orgId, {
      workflowVariables: {
        ...currentVariables,
        custom_variables: customVariables,
      },
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Remove a custom variable
export const removeCustomVariable = mutation({
  args: {
    orgId: v.id("orgs"),
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.orgId);
    if (!org) throw new Error("Organization not found");

    const currentVariables = org.workflowVariables || { custom_variables: [] };
    const customVariables = currentVariables.custom_variables || [];

    const updatedVariables = customVariables.filter((v) => v.key !== args.key);

    await ctx.db.patch(args.orgId, {
      workflowVariables: {
        ...currentVariables,
        custom_variables: updatedVariables,
      },
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get all tags used across clients in the org (for tag management)
export const getOrgTags = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    const clients = await ctx.db
      .query("clients")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    // Collect all unique tags
    const allTags = new Set<string>();
    clients.forEach((client) => {
      if (client.tags) {
        client.tags.forEach((tag) => allTags.add(tag));
      }
    });

    // Convert to array and sort
    const uniqueTags = Array.from(allTags).sort();

    // Calculate tag usage counts
    const tagCounts = new Map<string, number>();
    clients.forEach((client) => {
      if (client.tags) {
        client.tags.forEach((tag) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      }
    });

    return uniqueTags.map((tag) => ({
      name: tag,
      count: tagCounts.get(tag) || 0,
    }));
  },
});

// Create a new tag across the org
export const createOrgTag = mutation({
  args: {
    orgId: v.id("orgs"),
    tagName: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate tag name
    const trimmedTag = args.tagName.trim();
    if (!trimmedTag) {
      throw new Error("Tag name cannot be empty");
    }

    // Check if tag already exists (compute locally to avoid runQuery)
    const clients = await ctx.db
      .query("clients")
      .withIndex("by_org", (q: any) => q.eq("orgId", args.orgId))
      .collect();

    const allTags = new Set<string>();
    clients.forEach((client: any) => {
      if (client.tags) {
        client.tags.forEach((tag: string) => allTags.add(tag));
      }
    });

    const tagExists = Array.from(allTags).some(
      (tag) => tag.toLowerCase() === trimmedTag.toLowerCase(),
    );

    if (tagExists) {
      throw new Error("Tag already exists");
    }

    // For now, we'll just return success since tags are created when assigned to clients
    // In the future, you might want to have a dedicated tags table

    return {
      success: true,
      tagName: trimmedTag,
    };
  },
});
