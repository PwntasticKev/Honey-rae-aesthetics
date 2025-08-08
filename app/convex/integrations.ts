import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const platformValidator = v.union(
  v.literal("instagram"),
  v.literal("facebook"),
  v.literal("youtube"),
  v.literal("google_business"),
  v.literal("tiktok"),
  v.literal("linkedin"),
  v.literal("apple_business"),
  v.literal("google_calendar"),
  v.literal("stripe"),
  v.literal("twilio"),
  v.literal("mailchimp"),
  v.literal("aws_s3"),
);

// Get all integrations for a user
export const getUserIntegrations = query({
  args: {
    userId: v.id("users"),
    orgId: v.id("orgs"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userIntegrations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("orgId"), args.orgId))
      .collect();
  },
});

// Get integration by platform for a user
export const getIntegrationByPlatform = query({
  args: {
    userId: v.id("users"),
    platform: platformValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userIntegrations")
      .withIndex("by_user_platform", (q) =>
        q.eq("userId", args.userId).eq("platform", args.platform),
      )
      .first();
  },
});

// Create or update integration
export const upsertIntegration = mutation({
  args: {
    userId: v.id("users"),
    orgId: v.id("orgs"),
    platform: platformValidator,
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    accountId: v.optional(v.string()),
    accountName: v.optional(v.string()),
    accountEmail: v.optional(v.string()),
    tokenType: v.optional(v.string()),
    scopes: v.optional(v.array(v.string())),
    expiresAt: v.optional(v.number()),
    profileData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userIntegrations")
      .withIndex("by_user_platform", (q) =>
        q.eq("userId", args.userId).eq("platform", args.platform),
      )
      .first();

    const now = Date.now();
    const integrationData = {
      userId: args.userId,
      orgId: args.orgId,
      platform: args.platform,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      accountId: args.accountId,
      accountName: args.accountName,
      accountEmail: args.accountEmail,
      tokenType: args.tokenType || "Bearer",
      scopes: args.scopes,
      expiresAt: args.expiresAt,
      isActive: true,
      lastSync: now,
      syncError: undefined,
      profileData: args.profileData,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, integrationData);
      return existing._id;
    } else {
      return await ctx.db.insert("userIntegrations", {
        ...integrationData,
        createdAt: now,
      });
    }
  },
});

// Disconnect integration
export const disconnectIntegration = mutation({
  args: {
    userId: v.id("users"),
    platform: platformValidator,
  },
  handler: async (ctx, args) => {
    const integration = await ctx.db
      .query("userIntegrations")
      .withIndex("by_user_platform", (q) =>
        q.eq("userId", args.userId).eq("platform", args.platform),
      )
      .first();

    if (integration) {
      await ctx.db.patch(integration._id, {
        isActive: false,
        updatedAt: Date.now(),
      });
    }
  },
});

// Update sync status
export const updateSyncStatus = mutation({
  args: {
    integrationId: v.id("userIntegrations"),
    lastSync: v.optional(v.number()),
    syncError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.integrationId, {
      lastSync: args.lastSync || Date.now(),
      syncError: args.syncError,
      updatedAt: Date.now(),
    });
  },
});

// Get integration statistics
export const getIntegrationStats = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    const integrations = await ctx.db
      .query("userIntegrations")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const stats = {
      total: integrations.length,
      active: integrations.filter((i) => i.isActive).length,
      inactive: integrations.filter((i) => !i.isActive).length,
      byPlatform: {} as Record<string, number>,
      withErrors: integrations.filter((i) => i.syncError).length,
    };

    integrations.forEach((integration) => {
      stats.byPlatform[integration.platform] =
        (stats.byPlatform[integration.platform] || 0) + 1;
    });

    return stats;
  },
});
