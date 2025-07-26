import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
	args: {
		orgId: v.id("orgs"),
		clientId: v.id("clients"),
		dateTime: v.number(),
		type: v.string(),
		provider: v.string(),
		notes: v.optional(v.string()),
		googleEventId: v.optional(v.string()),
		status: v.optional(v.union(
			v.literal("scheduled"),
			v.literal("completed"),
			v.literal("cancelled"),
			v.literal("no_show")
		)),
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		const appointmentId = await ctx.db.insert("appointments", {
			...args,
			status: args.status || "scheduled",
			createdAt: now,
			updatedAt: now,
		});
		return appointmentId;
	},
});

export const get = query({
	args: { id: v.id("appointments") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

export const getByClient = query({
	args: { clientId: v.id("clients") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("appointments")
			.withIndex("by_client", (q) => q.eq("clientId", args.clientId))
			.order("desc")
			.collect();
	},
});

export const getByOrg = query({
	args: { orgId: v.id("orgs") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("appointments")
			.withIndex("by_org", (q) => q.eq("orgId", args.orgId))
			.order("desc")
			.collect();
	},
});

export const getUpcoming = query({
	args: { orgId: v.id("orgs"), limit: v.optional(v.number()) },
	handler: async (ctx, args) => {
		const now = Date.now();
		return await ctx.db
			.query("appointments")
			.withIndex("by_org", (q) => q.eq("orgId", args.orgId))
			.filter((q) => q.gte(q.field("dateTime"), now))
			.order("asc")
			.take(args.limit || 10);
	},
});

export const update = mutation({
	args: {
		id: v.id("appointments"),
		dateTime: v.optional(v.number()),
		type: v.optional(v.string()),
		provider: v.optional(v.string()),
		notes: v.optional(v.string()),
		googleEventId: v.optional(v.string()),
		status: v.optional(v.union(
			v.literal("scheduled"),
			v.literal("completed"),
			v.literal("cancelled"),
			v.literal("no_show")
		)),
	},
	handler: async (ctx, args) => {
		const { id, ...updates } = args;
		await ctx.db.patch(id, {
			...updates,
			updatedAt: Date.now(),
		});
	},
});

export const updateStatus = mutation({
	args: {
		id: v.id("appointments"),
		status: v.union(
			v.literal("scheduled"),
			v.literal("completed"),
			v.literal("cancelled"),
			v.literal("no_show")
		),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.id, {
			status: args.status,
			updatedAt: Date.now(),
		});
	},
});

export const remove = mutation({
	args: { id: v.id("appointments") },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
	},
}); 