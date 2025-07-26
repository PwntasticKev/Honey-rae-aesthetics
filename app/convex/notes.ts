import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
	args: {
		orgId: v.id("orgs"),
		clientId: v.id("clients"),
		authorId: v.id("users"),
		text: v.string(),
		tag: v.string(),
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		const noteId = await ctx.db.insert("notes", {
			...args,
			createdAt: now,
			updatedAt: now,
		});
		return noteId;
	},
});

export const get = query({
	args: { id: v.id("notes") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

export const getByClient = query({
	args: { clientId: v.id("clients") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("notes")
			.withIndex("by_client", (q) => q.eq("clientId", args.clientId))
			.order("desc")
			.collect();
	},
});

export const getByOrg = query({
	args: { orgId: v.id("orgs") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("notes")
			.withIndex("by_org", (q) => q.eq("orgId", args.orgId))
			.order("desc")
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
			.order("desc")
			.collect();
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