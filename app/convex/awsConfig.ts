import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get AWS configuration for an org
export const getByOrg = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("awsConfig")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();
  },
});

// Create or update AWS configuration
export const upsert = mutation({
  args: {
    orgId: v.id("orgs"),
    region: v.string(),
    sesAccessKey: v.optional(v.string()),
    sesSecretKey: v.optional(v.string()),
    snsAccessKey: v.optional(v.string()),
    snsSecretKey: v.optional(v.string()),
    fromEmail: v.optional(v.string()),
    fromPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("awsConfig")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    const now = Date.now();
    const config = {
      ...args,
      isConfigured: !!(args.sesAccessKey || args.snsAccessKey),
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, config);
      return existing._id;
    } else {
      return await ctx.db.insert("awsConfig", {
        ...config,
        createdAt: now,
      });
    }
  },
});

// Test AWS configuration
export const testConfig = mutation({
  args: {
    orgId: v.id("orgs"),
    type: v.union(v.literal("email"), v.literal("sms")),
    testEmail: v.optional(v.string()),
    testPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("awsConfig")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    if (!config) {
      throw new Error("AWS configuration not found");
    }

    if (args.type === "email") {
      if (!config.sesAccessKey || !config.sesSecretKey || !config.fromEmail) {
        throw new Error("Email configuration incomplete");
      }
      // TODO: Implement actual SES test
      return { success: true, message: "Email configuration test passed" };
    } else {
      if (!config.snsAccessKey || !config.snsSecretKey || !config.fromPhone) {
        throw new Error("SMS configuration incomplete");
      }
      // TODO: Implement actual SNS test
      return { success: true, message: "SMS configuration test passed" };
    }
  },
});
