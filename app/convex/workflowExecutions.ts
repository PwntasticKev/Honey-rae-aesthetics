import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
		const now = Date.now();
		const executionId = await ctx.db.insert("workflowExecutions", {
			...args,
			startedAt: now,
		});
		return executionId;
	},
});

export const get = query({
	args: { id: v.id("workflowExecutions") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

export const getByWorkflow = query({
	args: { workflowId: v.id("workflows") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("workflowExecutions")
			.withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
			.order("desc")
			.collect();
	},
});

export const getByClient = query({
	args: { clientId: v.id("clients") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("workflowExecutions")
			.withIndex("by_client", (q) => q.eq("clientId", args.clientId))
			.order("desc")
			.collect();
	},
});

export const getByOrg = query({
	args: { orgId: v.id("orgs") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("workflowExecutions")
			.withIndex("by_org", (q) => q.eq("orgId", args.orgId))
			.order("desc")
			.collect();
	},
});

export const updateStatus = mutation({
	args: {
		id: v.id("workflowExecutions"),
		status: v.union(
			v.literal("running"),
			v.literal("completed"),
			v.literal("failed"),
			v.literal("cancelled")
		),
		actionsCompleted: v.optional(v.array(v.number())),
		error: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { id, ...updates } = args;
		const patchData: any = { ...updates };
		
		if (args.status === "completed" || args.status === "failed" || args.status === "cancelled") {
			patchData.completedAt = Date.now();
		}
		
		await ctx.db.patch(id, patchData);
	},
});

export const addCompletedAction = mutation({
	args: {
		id: v.id("workflowExecutions"),
		actionOrder: v.number(),
	},
	handler: async (ctx, args) => {
		const execution = await ctx.db.get(args.id);
		if (!execution) throw new Error("Workflow execution not found");
		
		const updatedActions = [...execution.actionsCompleted, args.actionOrder];
		await ctx.db.patch(args.id, {
			actionsCompleted: updatedActions,
		});
	},
});

export const remove = mutation({
	args: { id: v.id("workflowExecutions") },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
	},
}); 