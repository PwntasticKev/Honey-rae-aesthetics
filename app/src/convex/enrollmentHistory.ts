import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new enrollment
export const create = mutation({
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

		return enrollmentId;
	},
});

// Get enrollments for an organization
export const getByOrg = query({
	args: {
		orgId: v.id("orgs"),
		limit: v.optional(v.number()),
		offset: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const enrollments = await ctx.db
			.query("workflowEnrollments")
			.withIndex("by_org", (q) => q.eq("orgId", args.orgId))
			.order("desc")
			.paginate({
				numItems: args.limit || 50,
				continueCursor: args.offset ? { _id: args.offset } : undefined,
			});

		// Get related data for each enrollment
		const enrollmentsWithData = await Promise.all(
			enrollments.page.map(async (enrollment) => {
				const [workflow, client] = await Promise.all([
					ctx.db.get(enrollment.workflowId),
					ctx.db.get(enrollment.clientId),
				]);

				// Calculate progress based on workflow steps
				const totalSteps = workflow?.blocks?.length || 0;
				const stepsCompleted = totalSteps > 0 ? Math.floor(Math.random() * totalSteps) : 0; // Mock for now
				const progress = totalSteps > 0 ? (stepsCompleted / totalSteps) * 100 : 0;

				return {
					...enrollment,
					workflow: workflow ? { name: workflow.name, description: workflow.description } : null,
					client: client ? {
						fullName: client.fullName,
						email: client.email,
						phones: client.phones,
					} : null,
					progress,
					stepsCompleted,
					totalSteps,
				};
			})
		);

		return {
			enrollments: enrollmentsWithData,
			nextCursor: enrollments.continueCursor,
		};
	},
});

// Get enrollments for a specific workflow
export const getByWorkflow = query({
	args: {
		workflowId: v.id("workflows"),
		limit: v.optional(v.number()),
		offset: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const enrollments = await ctx.db
			.query("workflowEnrollments")
			.withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
			.order("desc")
			.paginate({
				numItems: args.limit || 50,
				continueCursor: args.offset ? { _id: args.offset } : undefined,
			});

		// Get related data for each enrollment
		const enrollmentsWithData = await Promise.all(
			enrollments.page.map(async (enrollment) => {
				const [workflow, client] = await Promise.all([
					ctx.db.get(enrollment.workflowId),
					ctx.db.get(enrollment.clientId),
				]);

				// Calculate progress based on workflow steps
				const totalSteps = workflow?.blocks?.length || 0;
				const stepsCompleted = totalSteps > 0 ? Math.floor(Math.random() * totalSteps) : 0; // Mock for now
				const progress = totalSteps > 0 ? (stepsCompleted / totalSteps) * 100 : 0;

				return {
					...enrollment,
					workflow: workflow ? { name: workflow.name, description: workflow.description } : null,
					client: client ? {
						fullName: client.fullName,
						email: client.email,
						phones: client.phones,
					} : null,
					progress,
					stepsCompleted,
					totalSteps,
				};
			})
		);

		return {
			enrollments: enrollmentsWithData,
			nextCursor: enrollments.continueCursor,
		};
	},
});

// Get enrollments for a specific client
export const getByClient = query({
	args: {
		clientId: v.id("clients"),
		limit: v.optional(v.number()),
		offset: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const enrollments = await ctx.db
			.query("workflowEnrollments")
			.withIndex("by_client", (q) => q.eq("clientId", args.clientId))
			.order("desc")
			.paginate({
				numItems: args.limit || 50,
				continueCursor: args.offset ? { _id: args.offset } : undefined,
			});

		// Get related data for each enrollment
		const enrollmentsWithData = await Promise.all(
			enrollments.page.map(async (enrollment) => {
				const [workflow, client] = await Promise.all([
					ctx.db.get(enrollment.workflowId),
					ctx.db.get(enrollment.clientId),
				]);

				// Calculate progress based on workflow steps
				const totalSteps = workflow?.blocks?.length || 0;
				const stepsCompleted = totalSteps > 0 ? Math.floor(Math.random() * totalSteps) : 0; // Mock for now
				const progress = totalSteps > 0 ? (stepsCompleted / totalSteps) * 100 : 0;

				return {
					...enrollment,
					workflow: workflow ? { name: workflow.name, description: workflow.description } : null,
					client: client ? {
						fullName: client.fullName,
						email: client.email,
						phones: client.phones,
					} : null,
					progress,
					stepsCompleted,
					totalSteps,
				};
			})
		);

		return {
			enrollments: enrollmentsWithData,
			nextCursor: enrollments.continueCursor,
		};
	},
});

// Update enrollment status
export const updateStatus = mutation({
	args: {
		enrollmentId: v.id("workflowEnrollments"),
		currentStatus: v.union(v.literal("active"), v.literal("paused"), v.literal("completed"), v.literal("cancelled")),
		currentStep: v.optional(v.string()),
		nextExecutionAt: v.optional(v.number()),
		completedAt: v.optional(v.number()),
		metadata: v.optional(v.any()),
	},
	handler: async (ctx, args) => {
		const { enrollmentId, ...updates } = args;
		await ctx.db.patch(enrollmentId, updates);
	},
});

// Get enrollment statistics for an organization
export const getStats = query({
	args: {
		orgId: v.id("orgs"),
		startDate: v.optional(v.number()),
		endDate: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const startDate = args.startDate || Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days ago
		const endDate = args.endDate || Date.now();

		const enrollments = await ctx.db
			.query("workflowEnrollments")
			.withIndex("by_org", (q) => q.eq("orgId", args.orgId))
			.filter((q) => 
				q.and(
					q.gte(q.field("enrolledAt"), startDate),
					q.lte(q.field("enrolledAt"), endDate)
				)
			)
			.collect();

		const stats = {
			total: enrollments.length,
			active: enrollments.filter(e => e.currentStatus === "active").length,
			paused: enrollments.filter(e => e.currentStatus === "paused").length,
			completed: enrollments.filter(e => e.currentStatus === "completed").length,
			cancelled: enrollments.filter(e => e.currentStatus === "cancelled").length,
			byWorkflow: {} as Record<string, number>,
			byReason: {} as Record<string, number>,
		};

		// Count by workflow and reason
		for (const enrollment of enrollments) {
			stats.byReason[enrollment.enrollmentReason] = (stats.byReason[enrollment.enrollmentReason] || 0) + 1;
			
			const workflow = await ctx.db.get(enrollment.workflowId);
			if (workflow) {
				stats.byWorkflow[workflow.name] = (stats.byWorkflow[workflow.name] || 0) + 1;
			}
		}

		return stats;
	},
}); 