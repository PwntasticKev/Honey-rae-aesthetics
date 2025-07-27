import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getByOrg = query({
	args: { orgId: v.id("orgs") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("workflowExecutions")
			.withIndex("by_org", (q) => q.eq("orgId", args.orgId))
			.collect();
	},
});

export const getByWorkflow = query({
	args: { workflowId: v.id("workflows") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("workflowExecutions")
			.withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
			.collect();
	},
});

export const getByClient = query({
	args: { clientId: v.id("clients") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("workflowExecutions")
			.withIndex("by_client", (q) => q.eq("clientId", args.clientId))
			.collect();
	},
});

export const create = mutation({
	args: {
		orgId: v.id("orgs"),
		workflowId: v.id("workflows"),
		clientId: v.id("clients"),
		status: v.union(
			v.literal("running"),
			v.literal("completed"),
			v.literal("failed"),
			v.literal("cancelled")
		),
		actionsCompleted: v.array(v.number()),
		error: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const executionId = await ctx.db.insert("workflowExecutions", {
			orgId: args.orgId,
			workflowId: args.workflowId,
			clientId: args.clientId,
			status: args.status,
			actionsCompleted: args.actionsCompleted,
			error: args.error,
			startedAt: Date.now(),
		});
		return executionId;
	},
});

export const update = mutation({
	args: {
		id: v.id("workflowExecutions"),
		status: v.optional(v.union(
			v.literal("running"),
			v.literal("completed"),
			v.literal("failed"),
			v.literal("cancelled")
		)),
		actionsCompleted: v.optional(v.array(v.number())),
		error: v.optional(v.string()),
		completedAt: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const { id, ...updates } = args;
		await ctx.db.patch(id, updates);
	},
});

export const remove = mutation({
	args: { id: v.id("workflowExecutions") },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
	},
}); 