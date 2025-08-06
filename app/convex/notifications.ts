import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    orgId: v.id("orgs"),
    userId: v.optional(v.id("users")),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("info"),
      v.literal("success"),
      v.literal("warning"),
      v.literal("error"),
      v.literal("appointment"),
      v.literal("workflow"),
      v.literal("client"),
      v.literal("message"),
    ),
    actionUrl: v.optional(v.string()),
    actionText: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("notifications", {
      ...args,
      read: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const list = query({
  args: {
    orgId: v.id("orgs"),
    userId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("notifications")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId));

    if (args.userId) {
      query = query.filter((q) => q.eq(q.field("userId"), args.userId));
    }

    return await query
      .order("desc")
      .take(args.limit || 50);
  },
});

export const markAsRead = mutation({
  args: {
    id: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      read: true,
      updatedAt: Date.now(),
    });
  },
});

export const markAllAsRead = mutation({
  args: {
    orgId: v.id("orgs"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("notifications")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("read"), false));

    if (args.userId) {
      query = query.filter((q) => q.eq(q.field("userId"), args.userId));
    }

    const notifications = await query.collect();
    
    for (const notification of notifications) {
      await ctx.db.patch(notification._id, {
        read: true,
        updatedAt: Date.now(),
      });
    }
  },
});

export const remove = mutation({
  args: {
    id: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const getUnreadCount = query({
  args: {
    orgId: v.id("orgs"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("notifications")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("read"), false));

    if (args.userId) {
      query = query.filter((q) => q.eq(q.field("userId"), args.userId));
    }

    const notifications = await query.collect();
    return notifications.length;
  },
});

// Additional functions for convexNotificationService
export const deleteNotification = mutation({
  args: {
    id: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const clearAllNotifications = mutation({
  args: {
    orgId: v.id("orgs"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("notifications")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId));

    if (args.userId) {
      query = query.filter((q) => q.eq(q.field("userId"), args.userId));
    }

    const notifications = await query.collect();
    
    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }
  },
});

export const createNotification = create;
export const createAppUpdateNotification = create;
export const createWorkflowNotification = create;
export const createAppointmentNotification = create;
export const createClientNotification = create;
export const createMessageNotification = create;