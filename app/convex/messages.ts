import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new message record
export const create = mutation({
  args: {
    orgId: v.id("orgs"),
    clientId: v.optional(v.id("clients")),
    type: v.union(v.literal("sms"), v.literal("email")),
    content: v.string(),
    status: v.union(
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("failed"),
      v.literal("pending"),
    ),
    externalId: v.optional(v.string()),
    scheduledFor: v.optional(v.number()),
    sentAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      ...args,
      createdAt: Date.now(),
    });
    return messageId;
  },
});

// Update message status
export const updateStatus = mutation({
  args: {
    messageId: v.id("messages"),
    status: v.union(
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("failed"),
      v.literal("pending"),
    ),
    externalId: v.optional(v.string()),
    sentAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { messageId, status, externalId, sentAt } = args;
    await ctx.db.patch(messageId, {
      status,
      ...(externalId && { externalId }),
      ...(sentAt && { sentAt }),
    });
  },
});

// Get messages for an org
export const listByOrg = query({
  args: {
    orgId: v.id("orgs"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { orgId, limit = 50 } = args;
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .order("desc")
      .take(limit);
    return messages;
  },
});

// Get messages for a client
export const listByClient = query({
  args: {
    clientId: v.id("clients"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { clientId, limit = 50 } = args;
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_client", (q) => q.eq("clientId", clientId))
      .order("desc")
      .take(limit);
    return messages;
  },
});

// Get message statistics for an org
export const getStats = query({
  args: {
    orgId: v.id("orgs"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { orgId, days = 30 } = args;
    const cutoffDate = Date.now() - days * 24 * 60 * 60 * 1000;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .filter((q) => q.gte(q.field("createdAt"), cutoffDate))
      .collect();

    const stats = {
      total: messages.length,
      emails: messages.filter((m) => m.type === "email").length,
      sms: messages.filter((m) => m.type === "sms").length,
      sent: messages.filter((m) => m.status === "sent").length,
      delivered: messages.filter((m) => m.status === "delivered").length,
      failed: messages.filter((m) => m.status === "failed").length,
      pending: messages.filter((m) => m.status === "pending").length,
    };

    return stats;
  },
});
