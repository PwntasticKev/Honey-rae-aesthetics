import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";

// Add scheduled actions table to track cron-like tasks
// This would need to be added to schema.ts:
/*
scheduledActions: defineTable({
  orgId: v.id("orgs"),
  action: v.string(), // "processAppointmentCompletion", "syncCalendar", etc.
  args: v.any(), // Action arguments
  scheduledFor: v.number(), // When to execute
  status: v.union(
    v.literal("pending"),
    v.literal("running"),
    v.literal("completed"),
    v.literal("failed"),
  ),
  attempts: v.number(),
  maxAttempts: v.optional(v.number()),
  lastAttempt: v.optional(v.number()),
  error: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_org", ["orgId"])
  .index("by_status", ["status"])
  .index("by_scheduled_for", ["scheduledFor"]),
*/

// Create a scheduled action
export const scheduleAction = mutation({
  args: {
    orgId: v.id("orgs"),
    action: v.string(),
    args: v.any(),
    scheduledFor: v.number(),
    maxAttempts: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const actionId = await ctx.db.insert("scheduledActions", {
      orgId: args.orgId,
      action: args.action,
      args: args.args,
      scheduledFor: args.scheduledFor,
      status: "pending",
      attempts: 0,
      maxAttempts: args.maxAttempts || 3,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`Scheduled action ${args.action} for ${new Date(args.scheduledFor).toISOString()}`);
    return actionId;
  },
});

// Process pending scheduled actions (this would be called by a cron job)
export const processPendingActions = action({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const limit = args.limit || 50;

    // For now, return a placeholder result
    // This would be implemented with proper query and mutation functions
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    // This would actually:
    // 1. Query for pending scheduled actions
    // 2. Execute them based on their action type
    // 3. Update their status
    // 4. Handle retries and failures
    
    console.log(`Processed ${results.processed} scheduled actions:`, results);
    return results;
  },
});

// Process appointment completion (called by scheduled action)
async function processAppointmentCompletion(ctx: any, args: any) {
  try {
    const { orgId, appointmentId, clientId, appointmentTitle, appointmentEndTime } = args;

    // This would call the actual appointment trigger processing
    // For now, we'll simulate the workflow trigger logic
    console.log(`Processing appointment completion for appointment ${appointmentId}`);

    // Extract appointment type from title using the same logic as appointmentTriggers
    const appointmentType = extractAppointmentTypeFromTitle(appointmentTitle);
    if (!appointmentType) {
      console.log(`No workflow trigger found for appointment: ${appointmentTitle}`);
      return true; // Not an error, just no matching trigger
    }

    // Find matching workflows (placeholder logic)
    console.log(`Would trigger workflows for appointment type: ${appointmentType}`);
    
    // This would actually call the workflow enrollment logic
    // For now, we just log what would happen
    console.log(`Would enroll client ${clientId} in workflows for ${appointmentType}`);

    return true;
  } catch (error) {
    console.error("Error processing appointment completion:", error);
    return false;
  }
}

// Sync calendar for scheduled action
async function syncCalendarForAction(ctx: any, args: any) {
  try {
    const { orgId, providerId } = args;
    
    console.log(`Syncing calendar for provider ${providerId}`);
    
    // This would call the actual Google Calendar sync
    // For now, we just return success
    return true;
  } catch (error) {
    console.error("Error syncing calendar:", error);
    return false;
  }
}

// Helper function to extract appointment type (matches appointmentTriggers.ts logic)
function extractAppointmentTypeFromTitle(title: string): string | null {
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

// Get scheduled actions for an organization
export const getScheduledActions = query({
  args: {
    orgId: v.id("orgs"),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("scheduledActions")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const actions = args.limit
      ? await query.order("desc").take(args.limit)
      : await query.order("desc").collect();

    return actions;
  },
});

// Get action statistics
export const getActionStats = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    const actions = await ctx.db
      .query("scheduledActions")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const stats = {
      total: actions.length,
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
      overdue: 0,
    };

    const now = Date.now();
    actions.forEach((action) => {
      stats[action.status as keyof typeof stats]++;
      if (action.status === "pending" && action.scheduledFor < now) {
        stats.overdue++;
      }
    });

    return stats;
  },
});

// Cancel a scheduled action
export const cancelAction = mutation({
  args: { actionId: v.id("scheduledActions") },
  handler: async (ctx, args) => {
    const action = await ctx.db.get(args.actionId);
    if (!action) throw new Error("Action not found");

    if (action.status === "running") {
      throw new Error("Cannot cancel a running action");
    }

    await ctx.db.delete(args.actionId);
    console.log(`Cancelled scheduled action ${args.actionId}`);
  },
});

// Reschedule a failed action
export const rescheduleAction = mutation({
  args: { 
    actionId: v.id("scheduledActions"),
    newScheduleTime: v.number(),
  },
  handler: async (ctx, args) => {
    const action = await ctx.db.get(args.actionId);
    if (!action) throw new Error("Action not found");

    await ctx.db.patch(args.actionId, {
      status: "pending",
      scheduledFor: args.newScheduleTime,
      attempts: 0,
      error: undefined,
      updatedAt: Date.now(),
    });

    console.log(`Rescheduled action ${args.actionId} for ${new Date(args.newScheduleTime).toISOString()}`);
  },
});