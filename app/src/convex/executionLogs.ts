import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new execution log
export const create = mutation({
	args: {
		orgId: v.id("orgs"),
		workflowId: v.id("workflows"),
		enrollmentId: v.id("workflowEnrollments"),
		clientId: v.id("clients"),
		stepId: v.string(),
		action: v.string(),
		status: v.union(v.literal("executed"), v.literal("failed"), v.literal("waiting"), v.literal("cancelled")),
		message: v.optional(v.string()),
		metadata: v.optional(v.any()),
	},
	handler: async (ctx, args) => {
		const executionLogId = await ctx.db.insert("executionLogs", {
			orgId: args.orgId,
			workflowId: args.workflowId,
			enrollmentId: args.enrollmentId,
			clientId: args.clientId,
			stepId: args.stepId,
			action: args.action,
			status: args.status,
			executedAt: Date.now(),
			message: args.message,
			metadata: args.metadata,
		});

		return executionLogId;
	},
});

// Get execution logs for an organization
export const getByOrg = query({
	args: {
		orgId: v.id("orgs"),
		limit: v.optional(v.number()),
		offset: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const logs = await ctx.db
			.query("executionLogs")
			.withIndex("by_org", (q) => q.eq("orgId", args.orgId))
			.order("desc")
			.paginate({
				numItems: args.limit || 50,
				continueCursor: args.offset ? { _id: args.offset } : undefined,
			});

		// Get related data for each log
		const logsWithData = await Promise.all(
			logs.page.map(async (log) => {
				const [workflow, client, enrollment] = await Promise.all([
					ctx.db.get(log.workflowId),
					ctx.db.get(log.clientId),
					ctx.db.get(log.enrollmentId),
				]);

				return {
					...log,
					workflow: workflow ? { name: workflow.name, description: workflow.description } : null,
					client: client ? {
						fullName: client.fullName,
						email: client.email,
						phones: client.phones,
					} : null,
					enrollment: enrollment ? {
						enrollmentReason: enrollment.enrollmentReason,
						currentStatus: enrollment.currentStatus,
					} : null,
				};
			})
		);

		return {
			logs: logsWithData,
			nextCursor: logs.continueCursor,
		};
	},
});

// Get execution logs for a specific workflow
export const getByWorkflow = query({
	args: {
		workflowId: v.id("workflows"),
		limit: v.optional(v.number()),
		offset: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const logs = await ctx.db
			.query("executionLogs")
			.withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
			.order("desc")
			.paginate({
				numItems: args.limit || 50,
				continueCursor: args.offset ? { _id: args.offset } : undefined,
			});

		// Get related data for each log
		const logsWithData = await Promise.all(
			logs.page.map(async (log) => {
				const [workflow, client, enrollment] = await Promise.all([
					ctx.db.get(log.workflowId),
					ctx.db.get(log.clientId),
					ctx.db.get(log.enrollmentId),
				]);

				return {
					...log,
					workflow: workflow ? { name: workflow.name, description: workflow.description } : null,
					client: client ? {
						fullName: client.fullName,
						email: client.email,
						phones: client.phones,
					} : null,
					enrollment: enrollment ? {
						enrollmentReason: enrollment.enrollmentReason,
						currentStatus: enrollment.currentStatus,
					} : null,
				};
			})
		);

		return {
			logs: logsWithData,
			nextCursor: logs.continueCursor,
		};
	},
});

// Get execution logs for a specific client
export const getByClient = query({
	args: {
		clientId: v.id("clients"),
		limit: v.optional(v.number()),
		offset: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const logs = await ctx.db
			.query("executionLogs")
			.withIndex("by_client", (q) => q.eq("clientId", args.clientId))
			.order("desc")
			.paginate({
				numItems: args.limit || 50,
				continueCursor: args.offset ? { _id: args.offset } : undefined,
			});

		// Get related data for each log
		const logsWithData = await Promise.all(
			logs.page.map(async (log) => {
				const [workflow, client, enrollment] = await Promise.all([
					ctx.db.get(log.workflowId),
					ctx.db.get(log.clientId),
					ctx.db.get(log.enrollmentId),
				]);

				return {
					...log,
					workflow: workflow ? { name: workflow.name, description: workflow.description } : null,
					client: client ? {
						fullName: client.fullName,
						email: client.email,
						phones: client.phones,
					} : null,
					enrollment: enrollment ? {
						enrollmentReason: enrollment.enrollmentReason,
						currentStatus: enrollment.currentStatus,
					} : null,
				};
			})
		);

		return {
			logs: logsWithData,
			nextCursor: logs.continueCursor,
		};
	},
});

// Update execution log status
export const updateStatus = mutation({
	args: {
		logId: v.id("executionLogs"),
		status: v.union(v.literal("executed"), v.literal("failed"), v.literal("waiting"), v.literal("cancelled")),
		message: v.optional(v.string()),
		metadata: v.optional(v.any()),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.logId, {
			status: args.status,
			message: args.message,
			metadata: args.metadata,
		});
	},
});

// Get execution statistics for an organization
export const getStats = query({
	args: {
		orgId: v.id("orgs"),
		startDate: v.optional(v.number()),
		endDate: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const startDate = args.startDate || Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days ago
		const endDate = args.endDate || Date.now();

		const logs = await ctx.db
			.query("executionLogs")
			.withIndex("by_org", (q) => q.eq("orgId", args.orgId))
			.filter((q) => 
				q.and(
					q.gte(q.field("executedAt"), startDate),
					q.lte(q.field("executedAt"), endDate)
				)
			)
			.collect();

		const stats = {
			total: logs.length,
			executed: logs.filter(log => log.status === "executed").length,
			failed: logs.filter(log => log.status === "failed").length,
			waiting: logs.filter(log => log.status === "waiting").length,
			cancelled: logs.filter(log => log.status === "cancelled").length,
			byAction: {} as Record<string, number>,
			byWorkflow: {} as Record<string, number>,
		};

		// Count by action and workflow
		for (const log of logs) {
			stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
			
			const workflow = await ctx.db.get(log.workflowId);
			if (workflow) {
				stats.byWorkflow[workflow.name] = (stats.byWorkflow[workflow.name] || 0) + 1;
			}
		}

		return stats;
	},
}); 