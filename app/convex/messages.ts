import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
		const now = Date.now();
		const messageId = await ctx.db.insert("messages", {
			...args,
			createdAt: now,
		});
		return messageId;
	},
});

export const get = query({
	args: { id: v.id("messages") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

export const getByClient = query({
	args: { clientId: v.id("clients") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("messages")
			.withIndex("by_client", (q) => q.eq("clientId", args.clientId))
			.order("desc")
			.collect();
	},
});

export const getByOrg = query({
	args: { orgId: v.id("orgs") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("messages")
			.withIndex("by_org", (q) => q.eq("orgId", args.orgId))
			.order("desc")
			.collect();
	},
});

export const getByStatus = query({
	args: { orgId: v.id("orgs"), status: v.union(
		v.literal("sent"),
		v.literal("delivered"),
		v.literal("failed"),
		v.literal("pending")
	) },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("messages")
			.withIndex("by_org", (q) => q.eq("orgId", args.orgId))
			.filter((q) => q.eq(q.field("status"), args.status))
			.order("desc")
			.collect();
	},
});

export const updateStatus = mutation({
	args: {
		id: v.id("messages"),
		status: v.union(
			v.literal("sent"),
			v.literal("delivered"),
			v.literal("failed"),
			v.literal("pending")
		),
		sentAt: v.optional(v.number()),
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