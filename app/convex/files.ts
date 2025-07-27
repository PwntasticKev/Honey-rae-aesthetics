import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getByOrg = query({
	args: { orgId: v.id("orgs") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("files")
			.withIndex("by_org", (q) => q.eq("orgId", args.orgId))
			.collect();
	},
});

export const getByClient = query({
	args: { clientId: v.id("clients") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("files")
			.withIndex("by_client", (q) => q.eq("clientId", args.clientId))
			.collect();
	},
});

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
		const fileId = await ctx.db.insert("files", {
			orgId: args.orgId,
			clientId: args.clientId,
			key: args.key,
			filename: args.filename,
			type: args.type,
			size: args.size,
			cropData: args.cropData,
			tag: args.tag,
			thumbnailUrl: args.thumbnailUrl,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
		return fileId;
	},
});

export const update = mutation({
	args: {
		id: v.id("files"),
		filename: v.optional(v.string()),
		tag: v.optional(v.string()),
		cropData: v.optional(v.object({
			x: v.number(),
			y: v.number(),
			width: v.number(),
			height: v.number(),
		})),
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

export const remove = mutation({
	args: { id: v.id("files") },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
	},
}); 