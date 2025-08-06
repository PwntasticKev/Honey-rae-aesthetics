import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";

// Process appointment completion and trigger workflows
export const processAppointmentCompletion = mutation({
  args: {
    orgId: v.id("orgs"),
    appointmentId: v.id("appointments"),
    clientId: v.id("clients"),
    appointmentTitle: v.string(),
    appointmentEndTime: v.number(),
  },
  handler: async (ctx, args) => {
    // Extract appointment type from title (case-insensitive, partial matching)
    const appointmentType = extractAppointmentType(args.appointmentTitle);
    if (!appointmentType) {
      console.log(
        `No workflow trigger found for appointment: ${args.appointmentTitle}`,
      );
      return;
    }

    // Find workflows that match this appointment type
    const matchingWorkflows = await ctx.db
      .query("workflows")
      .withIndex("by_trigger", (q) => q.eq("trigger", appointmentType as any))
      .filter((q) =>
        q.and(
          q.eq(q.field("orgId"), args.orgId),
          q.eq(q.field("status"), "active"),
        ),
      )
      .collect();

    if (matchingWorkflows.length === 0) {
      console.log(`No active workflows found for trigger: ${appointmentType}`);
      return;
    }

    const triggeredWorkflows: any[] = [];
    const enrollmentIds: any[] = [];

    // Process each matching workflow
    for (const workflow of matchingWorkflows) {
      // Check for duplicate prevention
      if (workflow.preventDuplicates) {
        const cutoffTime =
          args.appointmentEndTime -
          (workflow.duplicatePreventionDays || 30) * 24 * 60 * 60 * 1000;

        const recentTrigger = await ctx.db
          .query("appointmentTriggers")
          .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
          .filter((q) =>
            q.and(
              q.eq(q.field("appointmentType"), appointmentType),
              q.gt(q.field("triggeredAt"), cutoffTime),
            ),
          )
          .first();

        if (recentTrigger) {
          console.log(
            `Skipping duplicate trigger for client ${args.clientId}, appointment type ${appointmentType}`,
          );
          continue;
        }
      }

      // Enroll client in workflow
      const enrollmentId = await ctx.db.insert("workflowEnrollments", {
        orgId: args.orgId,
        workflowId: workflow._id,
        clientId: args.clientId,
        enrollmentReason: `appointment_completed_${appointmentType}`,
        currentStatus: "active",
        enrolledAt: Date.now(),
        metadata: {
          appointmentId: args.appointmentId,
          appointmentTitle: args.appointmentTitle,
          appointmentEndTime: args.appointmentEndTime,
        },
      });

      // Log the enrollment
      await ctx.db.insert("executionLogs", {
        orgId: args.orgId,
        workflowId: workflow._id,
        enrollmentId,
        clientId: args.clientId,
        stepId: "appointment_trigger",
        action: "auto_enroll",
        status: "executed",
        executedAt: Date.now(),
        message: `Auto-enrolled from appointment: ${args.appointmentTitle}`,
        metadata: {
          appointmentType,
          appointmentId: args.appointmentId,
        },
      });

      triggeredWorkflows.push(workflow._id);
      enrollmentIds.push(enrollmentId);
    }

    // Record the trigger event
    if (triggeredWorkflows.length > 0) {
      await ctx.db.insert("appointmentTriggers", {
        orgId: args.orgId,
        appointmentId: args.appointmentId,
        clientId: args.clientId,
        appointmentType,
        triggeredWorkflows,
        enrollmentIds,
        triggeredAt: Date.now(),
        appointmentEndTime: args.appointmentEndTime,
        metadata: {
          appointmentTitle: args.appointmentTitle,
        },
      });
    }

    return {
      appointmentType,
      triggeredWorkflows: triggeredWorkflows.length,
      enrollments: enrollmentIds.length,
    };
  },
});

// Scheduled action to check for completed appointments
// Note: This would be implemented as a cron job or scheduled function
export const checkCompletedAppointments = action({
  args: {},
  handler: async (ctx) => {
    // This would integrate with the appointments system to check for completed appointments
    // and trigger the processAppointmentCompletion mutation
    console.log("Checking for completed appointments...");

    // Implementation would go here with proper function references
    return { processedAppointments: 0 };
  },
});

// Get trigger by appointment ID
export const getByAppointment = query({
  args: { appointmentId: v.id("appointments") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("appointmentTriggers")
      .withIndex("by_appointment", (q) =>
        q.eq("appointmentId", args.appointmentId),
      )
      .first();
  },
});

// Get recent triggers for an org
export const getRecentTriggers = query({
  args: {
    orgId: v.id("orgs"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("appointmentTriggers")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .order("desc");

    const triggers = args.limit
      ? await query.take(args.limit)
      : await query.collect();

    // Enrich with client and appointment details
    const enrichedTriggers = await Promise.all(
      triggers.map(async (trigger) => {
        const client = await ctx.db.get(trigger.clientId);
        const appointment = await ctx.db.get(trigger.appointmentId);

        // Get workflow details
        const workflows = await Promise.all(
          trigger.triggeredWorkflows.map((workflowId) =>
            ctx.db.get(workflowId),
          ),
        );

        return {
          ...trigger,
          client,
          appointment,
          workflows: workflows.filter(Boolean),
        };
      }),
    );

    return enrichedTriggers;
  },
});

// Helper function to extract appointment type from title
function extractAppointmentType(title: string): string | null {
  const lowerTitle = title.toLowerCase();

  // Define mapping patterns (case-insensitive, partial matching)
  const typeMapping = [
    { patterns: ["morpheus8", "morpheus"], type: "morpheus8" },
    {
      patterns: ["botox", "toxin", "wrinkle treatment", "neurotoxin"],
      type: "toxins",
    },
    {
      patterns: ["filler", "dermal filler", "juvederm", "restylane"],
      type: "filler",
    },
    { patterns: ["consultation", "consult", "initial"], type: "consultation" },
  ];

  for (const mapping of typeMapping) {
    for (const pattern of mapping.patterns) {
      if (lowerTitle.includes(pattern)) {
        return mapping.type;
      }
    }
  }

  return null;
}

// Get appointment trigger statistics
export const getTriggerStats = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    const triggers = await ctx.db
      .query("appointmentTriggers")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const stats = {
      totalTriggers: triggers.length,
      triggersByType: {} as Record<string, number>,
      totalEnrollments: 0,
      recentTriggers: 0, // Last 7 days
    };

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    triggers.forEach((trigger) => {
      // Count by type
      stats.triggersByType[trigger.appointmentType] =
        (stats.triggersByType[trigger.appointmentType] || 0) + 1;

      // Count enrollments
      stats.totalEnrollments += trigger.enrollmentIds.length;

      // Count recent triggers
      if (trigger.triggeredAt > weekAgo) {
        stats.recentTriggers++;
      }
    });

    return stats;
  },
});
