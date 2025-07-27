import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getByOrg = query({
	args: { orgId: v.id("orgs") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("notes")
			.withIndex("by_org", (q) => q.eq("orgId", args.orgId))
			.collect();
	},
});

export const getByClient = query({
	args: { clientId: v.id("clients") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("notes")
			.withIndex("by_client", (q) => q.eq("clientId", args.clientId))
			.collect();
	},
});

export const getByTag = query({
	args: { orgId: v.id("orgs"), tag: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("notes")
			.withIndex("by_org", (q) => q.eq("orgId", args.orgId))
			.filter((q) => q.eq(q.field("tag"), args.tag))
			.collect();
	},
});

export const create = mutation({
	args: {
		orgId: v.id("orgs"),
		clientId: v.id("clients"),
		authorId: v.id("users"),
		text: v.string(),
		tag: v.string(),
	},
	handler: async (ctx, args) => {
		const noteId = await ctx.db.insert("notes", {
			orgId: args.orgId,
			clientId: args.clientId,
			authorId: args.authorId,
			text: args.text,
			tag: args.tag,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
		return noteId;
	},
});

export const update = mutation({
	args: {
		id: v.id("notes"),
		text: v.optional(v.string()),
		tag: v.optional(v.string()),
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
	args: { id: v.id("notes") },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
	},
}); 