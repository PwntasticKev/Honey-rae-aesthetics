import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
	args: {
		orgId: v.id("orgs"),
		name: v.string(),
		description: v.optional(v.string()),
		trigger: v.union(
			v.literal("new_client"),
			v.literal("appointment_completed"),
			v.literal("appointment_scheduled"),
			v.literal("manual")
		),
		conditions: v.array(v.object({
			field: v.string(),
			operator: v.union(v.literal("equals"), v.literal("contains"), v.literal("greater_than")),
			value: v.string(),
		})),
		actions: v.array(v.object({
			type: v.union(
				v.literal("send_sms"),
				v.literal("send_email"),
				v.literal("delay"),
				v.literal("tag"),
				v.literal("conditional")
			),
			config: v.any(),
			order: v.number(),
		})),
		isActive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		const workflowId = await ctx.db.insert("workflows", {
			...args,
			isActive: args.isActive ?? true,
			createdAt: now,
			updatedAt: now,
		});
		return workflowId;
	},
});

export const get = query({
	args: { id: v.id("workflows") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

export const getByOrg = query({
	args: { orgId: v.id("orgs") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("workflows")
			.withIndex("by_org", (q) => q.eq("orgId", args.orgId))
			.order("desc")
			.collect();
	},
});

export const getAllWorkflows = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db
			.query("workflows")
			.order("desc")
			.collect();
	},
});

export const getByTrigger = query({
	args: { orgId: v.id("orgs"), trigger: v.union(
		v.literal("new_client"),
		v.literal("appointment_completed"),
		v.literal("appointment_scheduled"),
		v.literal("manual")
	) },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("workflows")
			.withIndex("by_org", (q) => q.eq("orgId", args.orgId))
			.filter((q) => q.and(
				q.eq(q.field("trigger"), args.trigger),
				q.eq(q.field("isActive"), true)
			))
			.collect();
	},
});

export const update = mutation({
	args: {
		id: v.id("workflows"),
		name: v.optional(v.string()),
		description: v.optional(v.string()),
		trigger: v.optional(v.union(
			v.literal("new_client"),
			v.literal("appointment_completed"),
			v.literal("appointment_scheduled"),
			v.literal("manual")
		)),
		conditions: v.optional(v.array(v.object({
			field: v.string(),
			operator: v.union(v.literal("equals"), v.literal("contains"), v.literal("greater_than")),
			value: v.string(),
		}))),
		actions: v.optional(v.array(v.object({
			type: v.union(
				v.literal("send_sms"),
				v.literal("send_email"),
				v.literal("delay"),
				v.literal("tag"),
				v.literal("conditional")
			),
			config: v.any(),
			order: v.number(),
		}))),
		isActive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const { id, ...updates } = args;
		await ctx.db.patch(id, {
			...updates,
			updatedAt: Date.now(),
		});
	},
});

export const toggleActive = mutation({
	args: { id: v.id("workflows") },
	handler: async (ctx, args) => {
		const workflow = await ctx.db.get(args.id);
		if (!workflow) throw new Error("Workflow not found");
		
		await ctx.db.patch(args.id, {
			isActive: !workflow.isActive,
			updatedAt: Date.now(),
		});
	},
});

export const remove = mutation({
	args: { id: v.id("workflows") },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
	},
}); 