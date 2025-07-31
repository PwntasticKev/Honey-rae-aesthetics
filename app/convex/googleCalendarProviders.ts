import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Save Google Calendar provider authentication
export const saveProvider = mutation({
  args: {
    orgId: v.id("orgs"),
    name: v.string(),
    email: v.string(),
    color: v.string(),
    accessToken: v.string(),
    googleCalendarId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { orgId, name, email, color, accessToken, googleCalendarId } = args;

    // Check if provider already exists for this org and email
    const existingProvider = await ctx.db
      .query("googleCalendarProviders")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .filter((q) => q.eq(q.field("email"), email))
      .first();

    if (existingProvider) {
      // Update existing provider
      return await ctx.db.patch(existingProvider._id, {
        name,
        color,
        isConnected: true,
        accessToken,
        googleCalendarId,
        updatedAt: Date.now(),
      });
    } else {
      // Create new provider
      return await ctx.db.insert("googleCalendarProviders", {
        orgId,
        name,
        email,
        color,
        isConnected: true,
        accessToken,
        googleCalendarId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

// Get all Google Calendar providers for an org
export const getByOrg = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("googleCalendarProviders")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();
  },
});

// Disconnect a Google Calendar provider
export const disconnect = mutation({
  args: { providerId: v.id("googleCalendarProviders") },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.providerId, {
      isConnected: false,
      accessToken: undefined,
      refreshToken: undefined,
      updatedAt: Date.now(),
    });
  },
});

// Update last sync time
export const updateLastSync = mutation({
  args: { providerId: v.id("googleCalendarProviders") },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.providerId, {
      lastSync: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
