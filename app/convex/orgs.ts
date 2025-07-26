import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
	args: {
		name: v.string(),
		logo: v.optional(v.string()),
		domain: v.optional(v.string()),
		qrKey: v.optional(v.string()),
		limits: v.object({
			clients: v.number(),
			storage_gb: v.number(),
			messages_per_month: v.number(),
		}),
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		const orgId = await ctx.db.insert("orgs", {
			...args,
			createdAt: now,
			updatedAt: now,
		});
		return orgId;
	},
});

export const get = query({
	args: { id: v.id("orgs") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

export const update = mutation({
	args: {
		id: v.id("orgs"),
		name: v.optional(v.string()),
		logo: v.optional(v.string()),
		domain: v.optional(v.string()),
		qrKey: v.optional(v.string()),
		limits: v.optional(v.object({
			clients: v.number(),
			storage_gb: v.number(),
			messages_per_month: v.number(),
		})),
	},
	handler: async (ctx, args) => {
		const { id, ...updates } = args;
		await ctx.db.patch(id, {
			...updates,
			updatedAt: Date.now(),
		});
	},
});

export const list = query({
	handler: async (ctx) => {
		return await ctx.db.query("orgs").collect();
	},
}); 