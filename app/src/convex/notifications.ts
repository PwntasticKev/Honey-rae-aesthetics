import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export interface NotificationData {
	orgId: Id<"orgs">;
	userId?: Id<"users">;
	title: string;
	message: string;
	type: 'info' | 'success' | 'warning' | 'error' | 'update' | 'message' | 'appointment' | 'workflow' | 'client';
	read: boolean;
	actionUrl?: string;
	actionText?: string;
	metadata?: Record<string, any>;
	createdAt: number;
	updatedAt: number;
}

// Create a new notification
export const createNotification = mutation({
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
			v.literal("update"),
			v.literal("message"),
			v.literal("appointment"),
			v.literal("workflow"),
			v.literal("client")
		),
		actionUrl: v.optional(v.string()),
		actionText: v.optional(v.string()),
		metadata: v.optional(v.any()),
	},
	handler: async (ctx, args) => {
		const notificationId = await ctx.db.insert("notifications", {
			orgId: args.orgId,
			userId: args.userId,
			title: args.title,
			message: args.message,
			type: args.type,
			read: false,
			actionUrl: args.actionUrl,
			actionText: args.actionText,
			metadata: args.metadata,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		return notificationId;
	},
});

// Get notifications for an organization
export const getNotifications = query({
	args: {
		orgId: v.id("orgs"),
		userId: v.optional(v.id("users")),
		limit: v.optional(v.number()),
		unreadOnly: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		let query = ctx.db.query("notifications").withIndex("by_org", (q) => q.eq("orgId", args.orgId));

		if (args.userId) {
			query = query.filter((q) => q.eq(q.field("userId"), args.userId));
		}

		if (args.unreadOnly) {
			query = query.filter((q) => q.eq(q.field("read"), false));
		}

		const notifications = await query.order("desc").take(args.limit || 50);

		return notifications;
	},
});

// Get unread notification count
export const getUnreadCount = query({
	args: {
		orgId: v.id("orgs"),
		userId: v.optional(v.id("users")),
	},
	handler: async (ctx, args) => {
		let query = ctx.db.query("notifications")
			.withIndex("by_org", (q) => q.eq("orgId", args.orgId))
			.filter((q) => q.eq(q.field("read"), false));

		if (args.userId) {
			query = query.filter((q) => q.eq(q.field("userId"), args.userId));
		}

		const notifications = await query.collect();
		return notifications.length;
	},
});

// Mark notification as read
export const markAsRead = mutation({
	args: {
		notificationId: v.id("notifications"),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.notificationId, {
			read: true,
			updatedAt: Date.now(),
		});
	},
});

// Mark all notifications as read
export const markAllAsRead = mutation({
	args: {
		orgId: v.id("orgs"),
		userId: v.optional(v.id("users")),
	},
	handler: async (ctx, args) => {
		let query = ctx.db.query("notifications")
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

// Delete notification
export const deleteNotification = mutation({
	args: {
		notificationId: v.id("notifications"),
	},
	handler: async (ctx, args) => {
		await ctx.db.delete(args.notificationId);
	},
});

// Clear all notifications
export const clearAllNotifications = mutation({
	args: {
		orgId: v.id("orgs"),
		userId: v.optional(v.id("users")),
	},
	handler: async (ctx, args) => {
		let query = ctx.db.query("notifications")
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

// Create specific notification types
export const createAppUpdateNotification = mutation({
	args: {
		orgId: v.id("orgs"),
		version: v.string(),
		features: v.array(v.string()),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("notifications", {
			orgId: args.orgId,
			title: "App Update Available",
			message: `Version ${args.version} is now available with new features: ${args.features.join(", ")}`,
			type: "update",
			read: false,
			actionUrl: "/settings/updates",
			actionText: "View Details",
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
	},
});

export const createWorkflowNotification = mutation({
	args: {
		orgId: v.id("orgs"),
		workflowName: v.string(),
		action: v.string(),
		workflowId: v.optional(v.id("workflows")),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("notifications", {
			orgId: args.orgId,
			title: "Workflow Alert",
			message: `Workflow "${args.workflowName}" ${args.action}`,
			type: "workflow",
			read: false,
			actionUrl: args.workflowId ? `/workflows/${args.workflowId}` : "/workflows",
			actionText: "View Workflow",
			metadata: {
				workflowName: args.workflowName,
				action: args.action,
				workflowId: args.workflowId,
			},
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
	},
});

export const createAppointmentNotification = mutation({
	args: {
		orgId: v.id("orgs"),
		clientName: v.string(),
		appointmentTime: v.number(),
		type: v.union(v.literal("reminder"), v.literal("confirmation"), v.literal("cancellation")),
		appointmentId: v.optional(v.id("appointments")),
	},
	handler: async (ctx, args) => {
		const messages = {
			reminder: `Reminder: You have an appointment with ${args.clientName} in 1 hour`,
			confirmation: `Appointment with ${args.clientName} has been confirmed`,
			cancellation: `Appointment with ${args.clientName} has been cancelled`,
		};

		return await ctx.db.insert("notifications", {
			orgId: args.orgId,
			title: "Appointment Notification",
			message: messages[args.type],
			type: "appointment",
			read: false,
			actionUrl: args.appointmentId ? `/appointments/${args.appointmentId}` : "/appointments",
			actionText: "View Appointment",
			metadata: {
				clientName: args.clientName,
				appointmentTime: args.appointmentTime,
				type: args.type,
				appointmentId: args.appointmentId,
			},
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
	},
});

export const createClientNotification = mutation({
	args: {
		orgId: v.id("orgs"),
		clientName: v.string(),
		action: v.string(),
		clientId: v.optional(v.id("clients")),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("notifications", {
			orgId: args.orgId,
			title: "Client Update",
			message: `${args.clientName} ${args.action}`,
			type: "client",
			read: false,
			actionUrl: args.clientId ? `/clients/${args.clientId}` : "/clients",
			actionText: "View Client",
			metadata: {
				clientName: args.clientName,
				action: args.action,
				clientId: args.clientId,
			},
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
	},
});

export const createMessageNotification = mutation({
	args: {
		orgId: v.id("orgs"),
		senderName: v.string(),
		messagePreview: v.string(),
		messageId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("notifications", {
			orgId: args.orgId,
			title: `New message from ${args.senderName}`,
			message: args.messagePreview,
			type: "message",
			read: false,
			actionUrl: args.messageId ? `/messaging/${args.messageId}` : "/messaging",
			actionText: "Reply",
			metadata: {
				senderName: args.senderName,
				messagePreview: args.messagePreview,
				messageId: args.messageId,
			},
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
	},
}); 