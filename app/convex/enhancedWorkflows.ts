import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get workflows with enhanced filtering
export const getWorkflows = query({
  args: {
    orgId: v.id("orgs"),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("inactive"),
        v.literal("draft"),
        v.literal("archived"),
      ),
    ),
    directoryId: v.optional(v.id("workflowDirectories")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("workflows")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId));

    // Apply status filter
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    // Apply directory filter
    if (args.directoryId !== undefined) {
      query = query.filter((q) =>
        q.eq(q.field("directoryId"), args.directoryId),
      );
    }

    const workflows = await query.order("desc").collect();

    // Enrich with enrollment counts
    const enrichedWorkflows = await Promise.all(
      workflows.map(async (workflow) => {
        const activeEnrollments = await ctx.db
          .query("workflowEnrollments")
          .withIndex("by_workflow", (q) => q.eq("workflowId", workflow._id))
          .filter((q) => q.eq(q.field("currentStatus"), "active"))
          .collect();

        const totalEnrollments = await ctx.db
          .query("workflowEnrollments")
          .withIndex("by_workflow", (q) => q.eq("workflowId", workflow._id))
          .collect();

        return {
          ...workflow,
          activeEnrollmentCount: activeEnrollments.length,
          totalEnrollmentCount: totalEnrollments.length,
        };
      }),
    );

    return enrichedWorkflows;
  },
});

// Create workflow with enhanced fields
export const createWorkflow = mutation({
  args: {
    orgId: v.id("orgs"),
    directoryId: v.optional(v.id("workflowDirectories")),
    name: v.string(),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("inactive"),
        v.literal("draft"),
        v.literal("archived"),
      ),
    ),
    trigger: v.union(
      v.literal("new_client"),
      v.literal("appointment_completed"),
      v.literal("appointment_scheduled"),
      v.literal("manual"),
      v.literal("morpheus8"),
      v.literal("toxins"),
      v.literal("filler"),
      v.literal("consultation"),
    ),
    preventDuplicates: v.optional(v.boolean()),
    duplicatePreventionDays: v.optional(v.number()),
    blocks: v.optional(v.array(v.any())),
    connections: v.optional(v.array(v.any())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("workflows", {
      orgId: args.orgId,
      directoryId: args.directoryId,
      name: args.name,
      description: args.description,
      status: args.status || "draft",
      trigger: args.trigger,
      preventDuplicates: args.preventDuplicates ?? true,
      duplicatePreventionDays: args.duplicatePreventionDays ?? 30,
      conditions: [],
      actions: [],
      blocks: args.blocks || [],
      connections: args.connections || [],
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      isActive: args.status === "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update workflow status (play/pause)
export const updateWorkflowStatus = mutation({
  args: {
    workflowId: v.id("workflows"),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("draft"),
      v.literal("archived"),
    ),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) throw new Error("Workflow not found");

    // When pausing, update all active enrollments
    if (args.status === "inactive" && workflow.status === "active") {
      const activeEnrollments = await ctx.db
        .query("workflowEnrollments")
        .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
        .filter((q) => q.eq(q.field("currentStatus"), "active"))
        .collect();

      for (const enrollment of activeEnrollments) {
        await ctx.db.patch(enrollment._id, {
          currentStatus: "paused",
          pausedAt: Date.now(),
        });
      }
    }

    // When resuming, reactivate paused enrollments and calculate catchup
    if (args.status === "active" && workflow.status === "inactive") {
      const pausedEnrollments = await ctx.db
        .query("workflowEnrollments")
        .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
        .filter((q) => q.eq(q.field("currentStatus"), "paused"))
        .collect();

      for (const enrollment of pausedEnrollments) {
        // Calculate new execution time based on pause duration
        let newExecutionTime = enrollment.nextExecutionAt;
        if (enrollment.pausedAt && newExecutionTime) {
          const pauseDuration = Date.now() - enrollment.pausedAt;
          newExecutionTime = Math.max(
            Date.now(),
            newExecutionTime + pauseDuration,
          );
        }

        await ctx.db.patch(enrollment._id, {
          currentStatus: "active",
          resumedAt: Date.now(),
          nextExecutionAt: newExecutionTime,
        });
      }
    }

    await ctx.db.patch(args.workflowId, {
      status: args.status,
      isActive: args.status === "active",
      updatedAt: Date.now(),
    });
  },
});

// Enroll client in workflow
export const enrollClientInWorkflow = mutation({
  args: {
    orgId: v.id("orgs"),
    workflowId: v.id("workflows"),
    clientId: v.id("clients"),
    enrollmentReason: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) throw new Error("Workflow not found");

    // Check for duplicate prevention
    if (workflow.preventDuplicates) {
      const cutoffTime =
        Date.now() - (workflow.duplicatePreventionDays || 30) * 24 * 60 * 60 * 1000;

      const recentEnrollment = await ctx.db
        .query("workflowEnrollments")
        .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
        .filter((q) =>
          q.and(
            q.eq(q.field("clientId"), args.clientId),
            q.gt(q.field("enrolledAt"), cutoffTime),
          ),
        )
        .first();

      if (recentEnrollment) {
        console.log(
          `Skipping duplicate enrollment for client ${args.clientId} in workflow ${args.workflowId}`,
        );
        return null; // Skip enrollment
      }
    }

    const now = Date.now();
    const enrollmentId = await ctx.db.insert("workflowEnrollments", {
      orgId: args.orgId,
      workflowId: args.workflowId,
      clientId: args.clientId,
      enrollmentReason: args.enrollmentReason,
      currentStatus: "active",
      enrolledAt: now,
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
      executedAt: now,
      message: `Client enrolled in workflow: ${args.enrollmentReason}`,
      metadata: args.metadata,
    });

    return enrollmentId;
  },
});

// Get enrollment history for a workflow
export const getWorkflowEnrollments = query({
  args: {
    workflowId: v.id("workflows"),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("paused"),
        v.literal("completed"),
        v.literal("cancelled"),
        v.literal("failed"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("workflowEnrollments")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("currentStatus"), args.status));
    }

    const enrollments = await query.order("desc").collect();

    // Enrich with client details
    const enrichedEnrollments = await Promise.all(
      enrollments.map(async (enrollment) => {
        const client = await ctx.db.get(enrollment.clientId);
        return {
          ...enrollment,
          client,
        };
      }),
    );

    return enrichedEnrollments;
  },
});

// Get execution logs for a workflow
export const getExecutionLogs = query({
  args: {
    workflowId: v.id("workflows"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const baseQuery = ctx.db
      .query("executionLogs")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .order("desc");

    const logs = args.limit
      ? await baseQuery.take(args.limit)
      : await baseQuery.collect();

    // Enrich with client details
    const enrichedLogs = await Promise.all(
      logs.map(async (log) => {
        const client = await ctx.db.get(log.clientId);
        const enrollment = await ctx.db.get(log.enrollmentId);
        return {
          ...log,
          client,
          enrollment,
        };
      }),
    );

    return enrichedLogs;
  },
});

// Get workflow statistics
export const getWorkflowStats = query({
  args: { workflowId: v.id("workflows") },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) return null;

    const enrollments = await ctx.db
      .query("workflowEnrollments")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .collect();

    const logs = await ctx.db
      .query("executionLogs")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .collect();

    const successfulLogs = logs.filter((log) => log.status === "executed");
    const failedLogs = logs.filter((log) => log.status === "failed");

    // Calculate average execution time
    const executionTimes = logs
      .filter((log) => log.executionTimeMs)
      .map((log) => log.executionTimeMs!);

    const averageExecutionTime =
      executionTimes.length > 0
        ? executionTimes.reduce((sum, time) => sum + time, 0) /
          executionTimes.length
        : 0;

    return {
      totalEnrollments: enrollments.length,
      activeEnrollments: enrollments.filter((e) => e.currentStatus === "active")
        .length,
      completedEnrollments: enrollments.filter(
        (e) => e.currentStatus === "completed",
      ).length,
      totalExecutions: logs.length,
      successfulExecutions: successfulLogs.length,
      failedExecutions: failedLogs.length,
      successRate:
        logs.length > 0 ? (successfulLogs.length / logs.length) * 100 : 0,
      averageExecutionTime,
      lastRun: workflow.lastRun,
    };
  },
});
