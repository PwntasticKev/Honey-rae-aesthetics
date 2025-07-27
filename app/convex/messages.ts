import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getByOrg = query({
	args: { orgId: v.id("orgs") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("messages")
			.withIndex("by_org", (q) => q.eq("orgId", args.orgId))
			.collect();
	},
});

export const getByClient = query({
	args: { clientId: v.id("clients") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("messages")
			.withIndex("by_client", (q) => q.eq("clientId", args.clientId))
			.collect();
	},
});

export const create = mutation({
	args: {
		orgId: v.id("orgs"),
		clientId: v.id("clients"),
		type: v.union(v.literal("sms"), v.literal("email")),
		content: v.string(),
		status: v.union(
			v.literal("sent"),
			v.literal("delivered"),
			v.literal("failed"),
			v.literal("pending")
		),
		externalId: v.optional(v.string()),
		scheduledFor: v.optional(v.number()),
		sentAt: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const messageId = await ctx.db.insert("messages", {
			orgId: args.orgId,
			clientId: args.clientId,
			type: args.type,
			content: args.content,
			status: args.status,
			externalId: args.externalId,
			scheduledFor: args.scheduledFor,
			sentAt: args.sentAt,
			createdAt: Date.now(),
		});
		return messageId;
	},
});

export const update = mutation({
	args: {
		id: v.id("messages"),
		status: v.optional(v.union(
			v.literal("sent"),
			v.literal("delivered"),
			v.literal("failed"),
			v.literal("pending")
		)),
		sentAt: v.optional(v.number()),
		externalId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { id, ...updates } = args;
		await ctx.db.patch(id, updates);
	},
});

export const remove = mutation({
	args: { id: v.id("messages") },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
	},
});

// Send message (simulated for demo)
export const sendMessage = mutation({
	args: {
		orgId: v.id("orgs"),
		clientId: v.id("clients"),
		type: v.union(v.literal("sms"), v.literal("email")),
		content: v.string(),
		scheduledFor: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const status = args.scheduledFor ? "pending" : "sent";
		const sentAt = args.scheduledFor ? undefined : Date.now();
		
		const messageId = await ctx.db.insert("messages", {
			orgId: args.orgId,
			clientId: args.clientId,
			type: args.type,
			content: args.content,
			status,
			externalId: `demo-${Date.now()}`,
			scheduledFor: args.scheduledFor,
			sentAt,
			createdAt: Date.now(),
		});
		
		return messageId;
	},
}); 