import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all workflows for an org
export const getWorkflows = query({
	args: { orgId: v.id("orgs") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("workflows")
			.withIndex("by_org", (q) => q.eq("orgId", args.orgId))
			.order("desc")
			.collect();
	},
});

// Create a new workflow
export const createWorkflow = mutation({
	args: {
		orgId: v.id("orgs"),
		name: v.string(),
		description: v.string(),
		trigger: v.string(),
		blocks: v.array(v.any()),
		connections: v.array(v.any()),
	},
	handler: async (ctx, args) => {
		const workflowId = await ctx.db.insert("workflows", {
			orgId: args.orgId,
			name: args.name,
			description: args.description,
			trigger: args.trigger,
			enabled: false,
			blocks: args.blocks,
			connections: args.connections,
			createdAt: Date.now(),
			updatedAt: Date.now(),
			runCount: 0,
		});
		return workflowId;
	},
});

// Update a workflow
export const updateWorkflow = mutation({
	args: {
		workflowId: v.id("workflows"),
		name: v.optional(v.string()),
		description: v.optional(v.string()),
		trigger: v.optional(v.string()),
		enabled: v.optional(v.boolean()),
		blocks: v.optional(v.array(v.any())),
		connections: v.optional(v.array(v.any())),
	},
	handler: async (ctx, args) => {
		const { workflowId, ...updates } = args;
		await ctx.db.patch(workflowId, {
			...updates,
			updatedAt: Date.now(),
		});
	},
});

// Delete a workflow
export const deleteWorkflow = mutation({
	args: { workflowId: v.id("workflows") },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.workflowId);
	},
});

// Toggle workflow enabled status
export const toggleWorkflow = mutation({
	args: { workflowId: v.id("workflows"), enabled: v.boolean() },
	handler: async (ctx, args) => {
		await ctx.db.patch(args.workflowId, {
			enabled: args.enabled,
			updatedAt: Date.now(),
		});
	},
});

// Get workflow enrollments
export const getWorkflowEnrollments = query({
	args: { workflowId: v.id("workflows") },
	handler: async (ctx, args) => {
		const enrollments = await ctx.db
			.query("workflowEnrollments")
			.withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
			.order("desc")
			.collect();

		// Get client details for each enrollment
		const enrollmentsWithClients = await Promise.all(
			enrollments.map(async (enrollment) => {
				const client = await ctx.db.get(enrollment.clientId);
				return {
					...enrollment,
					client,
				};
			})
		);

		return enrollmentsWithClients;
	},
});

// Enroll a client in a workflow
export const enrollClientInWorkflow = mutation({
	args: {
		orgId: v.id("orgs"),
		workflowId: v.id("workflows"),
		clientId: v.id("clients"),
		enrollmentReason: v.string(),
		metadata: v.optional(v.any()),
	},
	handler: async (ctx, args) => {
		const enrollmentId = await ctx.db.insert("workflowEnrollments", {
			orgId: args.orgId,
			workflowId: args.workflowId,
			clientId: args.clientId,
			enrollmentReason: args.enrollmentReason,
			enrolledAt: Date.now(),
			currentStatus: "active",
			metadata: args.metadata,
		});

		// Log the enrollment
		await ctx.db.insert("executionLogs", {
			orgId: args.orgId,
			workflowId: args.workflowId,
			enrollmentId,
			clientId: args.clientId,
			stepId: "enrollment",
			action: "enroll_client",
			status: "executed",
			executedAt: Date.now(),
			message: `Client enrolled in workflow: ${args.enrollmentReason}`,
			metadata: args.metadata,
		});

		return enrollmentId;
	},
});

// Get execution logs for a workflow
export const getExecutionLogs = query({
	args: { workflowId: v.id("workflows") },
	handler: async (ctx, args) => {
		const logs = await ctx.db
			.query("executionLogs")
			.withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
			.order("desc")
			.collect();

		// Get client details for each log
		const logsWithClients = await Promise.all(
			logs.map(async (log) => {
				const client = await ctx.db.get(log.clientId);
				return {
					...log,
					client,
				};
			})
		);

		return logsWithClients;
	},
});

// Log workflow execution
export const logWorkflowExecution = mutation({
	args: {
		orgId: v.id("orgs"),
		workflowId: v.id("workflows"),
		enrollmentId: v.id("workflowEnrollments"),
		clientId: v.id("clients"),
		stepId: v.string(),
		action: v.string(),
		status: v.string(),
		message: v.optional(v.string()),
		metadata: v.optional(v.any()),
	},
	handler: async (ctx, args) => {
		const logId = await ctx.db.insert("executionLogs", {
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

		// Update workflow run count
		const workflow = await ctx.db.get(args.workflowId);
		if (workflow) {
			await ctx.db.patch(args.workflowId, {
				runCount: workflow.runCount + 1,
				lastRun: Date.now(),
			});
		}

		return logId;
	},
});

// Update enrollment status
export const updateEnrollmentStatus = mutation({
	args: {
		enrollmentId: v.id("workflowEnrollments"),
		currentStatus: v.string(),
		currentStep: v.optional(v.string()),
		nextExecutionAt: v.optional(v.number()),
		completedAt: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.enrollmentId, {
			currentStatus: args.currentStatus,
			currentStep: args.currentStep,
			nextExecutionAt: args.nextExecutionAt,
			completedAt: args.completedAt,
		});
	},
});

// Get active enrollments (clients currently in workflows)
export const getActiveEnrollments = query({
	args: { orgId: v.id("orgs") },
	handler: async (ctx, args) => {
		const enrollments = await ctx.db
			.query("workflowEnrollments")
			.withIndex("by_org", (q) => q.eq("orgId", args.orgId))
			.filter((q) => q.eq(q.field("currentStatus"), "active"))
			.order("desc")
			.collect();

		// Get client and workflow details
		const enrollmentsWithDetails = await Promise.all(
			enrollments.map(async (enrollment) => {
				const client = await ctx.db.get(enrollment.clientId);
				const workflow = await ctx.db.get(enrollment.workflowId);
				return {
					...enrollment,
					client,
					workflow,
				};
			})
		);

		return enrollmentsWithDetails;
	},
}); 