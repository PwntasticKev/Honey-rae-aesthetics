import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    orgId: v.id("orgs"),
    fullName: v.string(),
    gender: v.union(v.literal("male"), v.literal("female"), v.literal("other")),
    dateOfBirth: v.optional(v.string()),
    phones: v.array(v.string()),
    email: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    address: v.optional(
      v.object({
        street: v.string(),
        city: v.string(),
        state: v.string(),
        zip: v.string(),
      }),
    ),
    referralSource: v.optional(v.string()),
    clientPortalStatus: v.optional(
      v.union(v.literal("active"), v.literal("inactive"), v.literal("pending")),
    ),
    profileImageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const clientId = await ctx.db.insert("clients", {
      ...args,
      tags: args.tags || [],
      clientPortalStatus: args.clientPortalStatus || "active",
      createdAt: now,
      updatedAt: now,
    });
    return clientId;
  },
});

// Create demo clients for testing
export const createDemoClients = mutation({
  args: {
    orgId: v.id("orgs"),
  },
  handler: async (ctx, args) => {
    const demoClients = [
      {
        fullName: "Sarah Johnson",
        gender: "female" as const,
        dateOfBirth: "1985-03-15",
        phones: ["+1-555-0123"],
        email: "sarah.johnson@example.com",
        tags: ["botox", "filler"],
        address: {
          street: "123 Main St",
          city: "Beverly Hills",
          state: "CA",
          zip: "90210",
        },
        referralSource: "Instagram",
        clientPortalStatus: "active" as const,
      },
      {
        fullName: "Michael Chen",
        gender: "male" as const,
        dateOfBirth: "1990-07-22",
        phones: ["+1-555-0456"],
        email: "michael.chen@example.com",
        tags: ["consultation"],
        address: {
          street: "456 Oak Ave",
          city: "Los Angeles",
          state: "CA",
          zip: "90024",
        },
        referralSource: "Google",
        clientPortalStatus: "active" as const,
      },
      {
        fullName: "Emily Rodriguez",
        gender: "female" as const,
        dateOfBirth: "1988-11-08",
        phones: ["+1-555-0789"],
        email: "emily.rodriguez@example.com",
        tags: ["morpheus8", "filler"],
        address: {
          street: "789 Sunset Blvd",
          city: "West Hollywood",
          state: "CA",
          zip: "90069",
        },
        referralSource: "Referral",
        clientPortalStatus: "active" as const,
      },
    ];

    const clientIds = [];
    for (const clientData of demoClients) {
      const clientId = await ctx.db.insert("clients", {
        orgId: args.orgId,
        ...clientData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      clientIds.push(clientId);
    }

    return clientIds;
  },
});

export const get = query({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByOrg = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clients")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clients")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const update = mutation({
  args: {
    id: v.id("clients"),
    fullName: v.optional(v.string()),
    gender: v.optional(
      v.union(v.literal("male"), v.literal("female"), v.literal("other")),
    ),
    dateOfBirth: v.optional(v.string()),
    phones: v.optional(v.array(v.string())),
    email: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    address: v.optional(
      v.object({
        street: v.string(),
        city: v.string(),
        state: v.string(),
        zip: v.string(),
      }),
    ),
    referralSource: v.optional(v.string()),
    clientPortalStatus: v.optional(
      v.union(v.literal("active"), v.literal("inactive"), v.literal("pending")),
    ),
    profileImageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const addTag = mutation({
  args: {
    id: v.id("clients"),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.id);
    if (!client) {
      throw new Error("Client not found");
    }

    const updatedTags = [...(client.tags || []), args.tag];
    await ctx.db.patch(args.id, {
      tags: updatedTags,
      updatedAt: Date.now(),
    });
  },
});

export const removeTag = mutation({
  args: {
    id: v.id("clients"),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.id);
    if (!client) {
      throw new Error("Client not found");
    }

    const updatedTags = (client.tags || []).filter((tag) => tag !== args.tag);
    await ctx.db.patch(args.id, {
      tags: updatedTags,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
