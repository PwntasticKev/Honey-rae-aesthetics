import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
	args: {
		orgId: v.id("orgs"),
		name: v.string(),
		type: v.union(v.literal("sms"), v.literal("email")),
		subject: v.optional(v.string()),
		content: v.string(),
		mergeTags: v.array(v.string()),
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		const templateId = await ctx.db.insert("messageTemplates", {
			...args,
			createdAt: now,
			updatedAt: now,
		});
		return templateId;
	},
});

export const get = query({
	args: { id: v.id("messageTemplates") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

export const getByOrg = query({
	args: { orgId: v.id("orgs") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("messageTemplates")
			.withIndex("by_org", (q) => q.eq("orgId", args.orgId))
			.order("desc")
			.collect();
	},
});

export const getByType = query({
	args: { orgId: v.id("orgs"), type: v.union(v.literal("sms"), v.literal("email")) },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("messageTemplates")
			.withIndex("by_org", (q) => q.eq("orgId", args.orgId))
			.filter((q) => q.eq(q.field("type"), args.type))
			.order("desc")
			.collect();
	},
});

export const update = mutation({
	args: {
		id: v.id("messageTemplates"),
		name: v.optional(v.string()),
		subject: v.optional(v.string()),
		content: v.optional(v.string()),
		mergeTags: v.optional(v.array(v.string())),
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
	args: { id: v.id("messageTemplates") },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
	},
}); 