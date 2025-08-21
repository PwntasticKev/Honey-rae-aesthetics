import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";

// Scheduled function that runs every 5 minutes to check for calendar updates and appointment completions
export const processWorkflowTriggers = internalAction({
  args: {},
  handler: async (
    ctx,
  ): Promise<{
    success: boolean;
    totalOrgs?: number;
    totalProcessed?: number;
    totalTriggered?: number;
    timestamp: number;
    error?: string;
  }> => {
    console.log("🔄 Starting workflow trigger processing...");

    try {
      // Get all active orgs
      const orgs = await ctx.runQuery(internal.workflowScheduler.getActiveOrgs);

      let totalProcessed = 0;
      let totalTriggered = 0;

      for (const org of orgs) {
        // Process calendar updates for this org
        const calendarResult = await ctx.runMutation(
          internal.workflowScheduler.processCalendarUpdates,
          { orgId: org._id },
        );

        // Process appointment completions for this org
        const completionResult = await ctx.runMutation(
          internal.workflowScheduler.processAppointmentCompletions,
          { orgId: org._id },
        );

        totalProcessed += calendarResult.processed + completionResult.processed;
        totalTriggered += calendarResult.triggered + completionResult.triggered;

        console.log(
          `📊 Org ${org.name}: Calendar(${calendarResult.processed}/${calendarResult.triggered}) Completions(${completionResult.processed}/${completionResult.triggered})`,
        );
      }

      console.log(
        `✅ Workflow processing complete: ${totalProcessed} processed, ${totalTriggered} triggered`,
      );

      return {
        success: true,
        totalOrgs: orgs.length,
        totalProcessed,
        totalTriggered,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("❌ Error in workflow trigger processing:", error);
      return {
        success: false,
        error: String(error),
        timestamp: Date.now(),
      };
    }
  },
});

// Get all active organizations
export const getActiveOrgs = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("orgs").collect();
  },
});

// Process calendar updates for an organization
export const processCalendarUpdates = internalMutation({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    // Get all connected Google Calendar providers for this org
    const providers = await ctx.db
      .query("googleCalendarProviders")
      .withIndex("by_org", (q: any) => q.eq("orgId", args.orgId))
      .filter((q: any) => q.eq(q.field("isConnected"), true))
      .collect();

    let processed = 0;
    let triggered = 0;

    for (const provider of providers) {
      // Check for recent appointments that need workflow triggers
      const recentAppointments = await ctx.db
        .query("appointments")
        .withIndex("by_org", (q: any) => q.eq("orgId", args.orgId))
        .filter((q: any) =>
          q.and(
            q.eq(q.field("provider"), provider.name),
            q.eq(q.field("status"), "scheduled"),
            q.gt(q.field("createdAt"), Date.now() - 5 * 60 * 1000), // Last 5 minutes
          ),
        )
        .collect();

      for (const appointment of recentAppointments) {
        processed++;

        // Check if this appointment should trigger workflows
        const triggerResult = await triggerAppointmentWorkflows(
          ctx,
          args.orgId,
          appointment,
          "appointment_scheduled",
        );

        if (triggerResult.triggered > 0) {
          triggered++;
        }
      }
    }

    return { processed, triggered };
  },
});

// Process appointment completions for an organization
export const processAppointmentCompletions = internalMutation({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    // Find appointments that recently ended (within last 5 minutes)
    const completedAppointments = await ctx.db
      .query("appointments")
      .withIndex("by_org", (q: any) => q.eq("orgId", args.orgId))
      .filter((q: any) =>
        q.and(
          q.eq(q.field("status"), "scheduled"),
          q.lt(q.field("dateTime"), now), // Appointment time has passed
          q.gt(q.field("dateTime"), fiveMinutesAgo - 60 * 60 * 1000), // But not too old (1 hour buffer)
        ),
      )
      .collect();

    let processed = 0;
    let triggered = 0;

    for (const appointment of completedAppointments) {
      // Calculate estimated end time (add 1 hour to start time as default)
      const estimatedEndTime = appointment.dateTime + 60 * 60 * 1000;

      // Only process if the estimated end time has passed
      if (estimatedEndTime <= now) {
        processed++;

        // Update appointment status to completed
        await ctx.db.patch(appointment._id, {
          status: "completed",
          updatedAt: now,
        });

        // Trigger completion workflows
        const triggerResult = await triggerAppointmentWorkflows(
          ctx,
          args.orgId,
          appointment,
          "appointment_completed",
        );

        if (triggerResult.triggered > 0) {
          triggered++;
        }
      }
    }

    return { processed, triggered };
  },
});

// Helper function to trigger workflows for an appointment
async function triggerAppointmentWorkflows(
  ctx: any,
  orgId: string,
  appointment: any,
  triggerType: "appointment_scheduled" | "appointment_completed",
): Promise<{ triggered: number; enrollmentIds: string[] }> {
  // Extract appointment type from the appointment title/type
  const appointmentType = extractAppointmentTypeForWorkflow(appointment.type);

  // Find matching workflows
  const workflows = await ctx.db
    .query("workflows")
    .withIndex("by_org", (q: any) => q.eq("orgId", orgId))
    .filter((q: any) =>
      q.and(
        q.eq(q.field("status"), "active"),
        q.or(
          q.eq(q.field("trigger"), triggerType),
          q.eq(q.field("trigger"), appointmentType), // Also check for specific appointment type triggers
        ),
      ),
    )
    .collect();

  let triggered = 0;
  const enrollmentIds: string[] = [];

  for (const workflow of workflows) {
    // Check for duplicate prevention
    if (workflow.preventDuplicates) {
      const cutoffTime =
        Date.now() -
        (workflow.duplicatePreventionDays || 30) * 24 * 60 * 60 * 1000;

      const recentEnrollment = await ctx.db
        .query("workflowEnrollments")
        .withIndex("by_workflow", (q: any) => q.eq("workflowId", workflow._id))
        .filter((q: any) =>
          q.and(
            q.eq(q.field("clientId"), appointment.clientId),
            q.gt(q.field("enrolledAt"), cutoffTime),
          ),
        )
        .first();

      if (recentEnrollment) {
        console.log(
          `⏭️ Skipping duplicate enrollment for client ${appointment.clientId} in workflow ${workflow._id}`,
        );
        continue;
      }
    }

    // Enroll client in workflow
    const enrollmentId = await ctx.db.insert("workflowEnrollments", {
      orgId,
      workflowId: workflow._id,
      clientId: appointment.clientId,
      enrollmentReason: `${triggerType}_${appointmentType}`,
      currentStatus: "active",
      enrolledAt: Date.now(),
      metadata: {
        appointmentId: appointment._id,
        appointmentType: appointment.type,
        appointmentDate: appointment.dateTime,
        triggerType,
      },
    });

    // Log the enrollment
    await ctx.db.insert("executionLogs", {
      orgId,
      workflowId: workflow._id,
      enrollmentId,
      clientId: appointment.clientId,
      stepId: "auto_trigger",
      action: "enroll_client",
      status: "executed",
      executedAt: Date.now(),
      message: `Auto-enrolled from ${triggerType}: ${appointment.type}`,
      metadata: {
        appointmentType,
        appointmentId: appointment._id,
        triggerType,
      },
    });

    triggered++;
    enrollmentIds.push(enrollmentId);
  }

  return { triggered, enrollmentIds };
}

// Helper function to extract workflow trigger type from appointment type
function extractAppointmentTypeForWorkflow(appointmentType: string): string {
  const lowerType = appointmentType.toLowerCase();

  // Map appointment types to workflow trigger types
  if (lowerType.includes("morpheus8") || lowerType.includes("morpheus")) {
    return "morpheus8";
  }
  if (
    lowerType.includes("botox") ||
    lowerType.includes("toxin") ||
    lowerType.includes("neurotoxin")
  ) {
    return "toxins";
  }
  if (
    lowerType.includes("filler") ||
    lowerType.includes("dermal") ||
    lowerType.includes("juvederm") ||
    lowerType.includes("restylane")
  ) {
    return "filler";
  }
  if (lowerType.includes("consultation") || lowerType.includes("consult")) {
    return "consultation";
  }

  // Default fallback
  return "appointment_completed";
}

// Process pending workflow steps (scheduled actions)
export const processScheduledWorkflowSteps = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("⏰ Processing scheduled workflow steps...");

    try {
      // Get all pending scheduled actions that are due
      const dueActions = await ctx.runQuery(
        internal.workflowScheduler.getDueScheduledActions,
      );

      let processed = 0;
      let successful = 0;
      let failed = 0;

      for (const action of dueActions) {
        processed++;

        try {
          // Process the scheduled action
          await ctx.runMutation(
            internal.workflowScheduler.executeScheduledAction,
            {
              actionId: action._id,
            },
          );
          successful++;
        } catch (error) {
          failed++;
          console.error(
            `❌ Failed to execute scheduled action ${action._id}:`,
            error,
          );

          // Update action status to failed
          await ctx.runMutation(
            internal.workflowScheduler.markScheduledActionFailed,
            {
              actionId: action._id,
              error: String(error),
            },
          );
        }
      }

      console.log(
        `⏰ Scheduled actions processed: ${processed} total, ${successful} successful, ${failed} failed`,
      );

      return {
        success: true,
        processed,
        successful,
        failed,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("❌ Error in scheduled workflow step processing:", error);
      return {
        success: false,
        error: String(error),
        timestamp: Date.now(),
      };
    }
  },
});

// Get scheduled actions that are due for execution
export const getDueScheduledActions = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    return await ctx.db
      .query("scheduledActions")
      .withIndex("by_scheduled_for", (q: any) => q.lte("scheduledFor", now))
      .filter((q: any) => q.eq(q.field("status"), "pending"))
      .collect();
  },
});

// Execute a scheduled action
export const executeScheduledAction = internalMutation({
  args: { actionId: v.id("scheduledActions") },
  handler: async (ctx, args) => {
    const action = await ctx.db.get(args.actionId);
    if (!action) {
      throw new Error("Scheduled action not found");
    }

    // Mark as running
    await ctx.db.patch(args.actionId, {
      status: "running",
      lastAttempt: Date.now(),
      attempts: (action.attempts || 0) + 1,
      updatedAt: Date.now(),
    });

    try {
      // Execute the action based on its type
      switch (action.action) {
        case "process_workflow_step":
          await processWorkflowStep(ctx, action.args);
          break;
        case "send_scheduled_message":
          await sendScheduledMessage(ctx, action.args);
          break;
        default:
          throw new Error(`Unknown scheduled action type: ${action.action}`);
      }

      // Mark as completed
      await ctx.db.patch(args.actionId, {
        status: "completed",
        updatedAt: Date.now(),
      });
    } catch (error) {
      // Check if we should retry
      const maxAttempts = action.maxAttempts || 3;
      const currentAttempts = (action.attempts || 0) + 1;

      if (currentAttempts < maxAttempts) {
        // Schedule retry in 5 minutes
        await ctx.db.patch(args.actionId, {
          status: "pending",
          scheduledFor: Date.now() + 5 * 60 * 1000,
          error: String(error),
          updatedAt: Date.now(),
        });
      } else {
        // Mark as failed
        await ctx.db.patch(args.actionId, {
          status: "failed",
          error: String(error),
          updatedAt: Date.now(),
        });
      }

      throw error;
    }
  },
});

// Mark a scheduled action as failed
export const markScheduledActionFailed = internalMutation({
  args: {
    actionId: v.id("scheduledActions"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.actionId, {
      status: "failed",
      error: args.error,
      updatedAt: Date.now(),
    });
  },
});

// Helper function to process a workflow step
async function processWorkflowStep(ctx: any, args: any) {
  const { enrollmentId, stepId, stepConfig } = args;

  // Get the enrollment
  const enrollment = await ctx.db.get(enrollmentId);
  if (!enrollment) {
    throw new Error("Workflow enrollment not found");
  }

  // Get the workflow
  const workflow = await ctx.db.get(enrollment.workflowId);
  if (!workflow) {
    throw new Error("Workflow not found");
  }

  // Get the client
  const client = await ctx.db.get(enrollment.clientId);
  if (!client) {
    throw new Error("Client not found");
  }

  // Execute the step based on its type
  const stepType = stepConfig.type;

  try {
    switch (stepType) {
      case "send_sms":
        await executeSMSStep(ctx, enrollment, client, stepConfig);
        break;
      case "send_email":
        await executeEmailStep(ctx, enrollment, client, stepConfig);
        break;
      case "add_tag":
        await executeAddTagStep(ctx, client, stepConfig);
        break;
      case "remove_tag":
        await executeRemoveTagStep(ctx, client, stepConfig);
        break;
      case "delay":
        await executeDelayStep(ctx, enrollment, stepConfig);
        break;
      default:
        throw new Error(`Unknown step type: ${stepType}`);
    }

    // Log successful execution
    await ctx.db.insert("executionLogs", {
      orgId: enrollment.orgId,
      workflowId: enrollment.workflowId,
      enrollmentId: enrollment._id,
      clientId: enrollment.clientId,
      stepId,
      action: stepType,
      status: "executed",
      executedAt: Date.now(),
      message: `Successfully executed ${stepType} step`,
      metadata: stepConfig,
    });
  } catch (error) {
    // Log failed execution
    await ctx.db.insert("executionLogs", {
      orgId: enrollment.orgId,
      workflowId: enrollment.workflowId,
      enrollmentId: enrollment._id,
      clientId: enrollment.clientId,
      stepId,
      action: stepType,
      status: "failed",
      executedAt: Date.now(),
      message: `Failed to execute ${stepType} step: ${String(error)}`,
      error: String(error),
      metadata: stepConfig,
    });

    throw error;
  }
}

// Helper functions for executing different step types
async function executeSMSStep(
  ctx: any,
  enrollment: any,
  client: any,
  stepConfig: any,
) {
  // This would integrate with your SMS service
  console.log(
    `📱 Would send SMS to ${client.phones[0] || "no phone"}: ${stepConfig.message}`,
  );
}

async function executeEmailStep(
  ctx: any,
  enrollment: any,
  client: any,
  stepConfig: any,
) {
  // This would integrate with your email service
  console.log(
    `📧 Would send email to ${client.email || "no email"}: ${stepConfig.subject}`,
  );
}

async function executeAddTagStep(ctx: any, client: any, stepConfig: any) {
  const newTags = client.tags || [];
  if (!newTags.includes(stepConfig.tag)) {
    newTags.push(stepConfig.tag);
    await ctx.db.patch(client._id, {
      tags: newTags,
      updatedAt: Date.now(),
    });
  }
}

async function executeRemoveTagStep(ctx: any, client: any, stepConfig: any) {
  const tags = client.tags || [];
  const updatedTags = stepConfig.removeAll
    ? []
    : tags.filter((tag: string) => tag !== stepConfig.tag);

  await ctx.db.patch(client._id, {
    tags: updatedTags,
    updatedAt: Date.now(),
  });
}

async function executeDelayStep(ctx: any, enrollment: any, stepConfig: any) {
  // Calculate delay in milliseconds
  const { value, unit } = stepConfig;
  let delayMs = 0;

  switch (unit) {
    case "seconds":
      delayMs = value * 1000;
      break;
    case "minutes":
      delayMs = value * 60 * 1000;
      break;
    case "hours":
      delayMs = value * 60 * 60 * 1000;
      break;
    case "days":
      delayMs = value * 24 * 60 * 60 * 1000;
      break;
    case "weeks":
      delayMs = value * 7 * 24 * 60 * 60 * 1000;
      break;
    case "months":
      delayMs = value * 30 * 24 * 60 * 60 * 1000; // Approximate
      break;
    default:
      delayMs = value * 24 * 60 * 60 * 1000; // Default to days
  }

  // Schedule the next step
  const nextExecutionTime = Date.now() + delayMs;

  await ctx.db.patch(enrollment._id, {
    nextExecutionAt: nextExecutionTime,
    updatedAt: Date.now(),
  });
}

async function sendScheduledMessage(ctx: any, args: any) {
  // This would integrate with your messaging service
  console.log("📮 Processing scheduled message:", args);
}
