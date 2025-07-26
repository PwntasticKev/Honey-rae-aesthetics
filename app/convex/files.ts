import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
	args: {
		orgId: v.id("orgs"),
		clientId: v.id("clients"),
		key: v.string(),
		filename: v.string(),
		type: v.string(),
		size: v.number(),
		cropData: v.optional(v.object({
			x: v.number(),
			y: v.number(),
			width: v.number(),
			height: v.number(),
		})),
		tag: v.string(),
		thumbnailUrl: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		const fileId = await ctx.db.insert("files", {
			...args,
			createdAt: now,
			updatedAt: now,
		});
		return fileId;
	},
});

export const get = query({
	args: { id: v.id("files") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

export const getByClient = query({
	args: { clientId: v.id("clients") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("files")
			.withIndex("by_client", (q) => q.eq("clientId", args.clientId))
			.order("desc")
			.collect();
	},
});

export const getByTag = query({
	args: { clientId: v.id("clients"), tag: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("files")
			.withIndex("by_client", (q) => q.eq("clientId", args.clientId))
			.filter((q) => q.eq(q.field("tag"), args.tag))
			.order("desc")
			.collect();
	},
});

export const getByOrg = query({
	args: { orgId: v.id("orgs") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("files")
			.withIndex("by_org", (q) => q.eq("orgId", args.orgId))
			.order("desc")
			.collect();
	},
});

export const update = mutation({
	args: {
		id: v.id("files"),
		filename: v.optional(v.string()),
		cropData: v.optional(v.object({
			x: v.number(),
			y: v.number(),
			width: v.number(),
			height: v.number(),
		})),
		tag: v.optional(v.string()),
		thumbnailUrl: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { id, ...updates } = args;
		await ctx.db.patch(id, {
			...updates,
			updatedAt: Date.now(),
		});
	},
});

export const updateTag = mutation({
	args: {
		id: v.id("files"),
		tag: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.id, {
			tag: args.tag,
			updatedAt: Date.now(),
		});
	},
});

export const remove = mutation({
	args: { id: v.id("files") },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
	},
}); 