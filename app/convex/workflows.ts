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
      v.literal("manual"),
    ),
    conditions: v.array(
      v.object({
        field: v.string(),
        operator: v.union(
          v.literal("equals"),
          v.literal("contains"),
          v.literal("greater_than"),
        ),
        value: v.string(),
      }),
    ),
    actions: v.array(
      v.object({
        type: v.union(
          v.literal("send_sms"),
          v.literal("send_email"),
          v.literal("delay"),
          v.literal("tag"),
          v.literal("conditional"),
        ),
        config: v.any(),
        order: v.number(),
      }),
    ),
    blocks: v.optional(
      v.array(
        v.object({
          id: v.string(),
          type: v.string(),
          position: v.object({
            x: v.number(),
            y: v.number(),
          }),
          width: v.number(),
          height: v.number(),
          config: v.any(),
        }),
      ),
    ),
    connections: v.optional(
      v.array(
        v.object({
          id: v.string(),
          from: v.string(),
          to: v.string(),
          fromPort: v.string(),
          toPort: v.string(),
        }),
      ),
    ),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const workflowId = await ctx.db.insert("workflows", {
      ...args,
      status: "draft",
      preventDuplicates: true,
      duplicatePreventionDays: 30,
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
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
    return await ctx.db.query("workflows").order("desc").collect();
  },
});

export const getByTrigger = query({
  args: {
    orgId: v.id("orgs"),
    trigger: v.union(
      v.literal("new_client"),
      v.literal("appointment_completed"),
      v.literal("appointment_scheduled"),
      v.literal("manual"),
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workflows")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) =>
        q.and(
          q.eq(q.field("trigger"), args.trigger),
          q.eq(q.field("isActive"), true),
        ),
      )
      .collect();
  },
});

export const update = mutation({
  args: {
    id: v.id("workflows"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    trigger: v.optional(
      v.union(
        v.literal("new_client"),
        v.literal("appointment_completed"),
        v.literal("appointment_scheduled"),
        v.literal("manual"),
      ),
    ),
    conditions: v.optional(
      v.array(
        v.object({
          field: v.string(),
          operator: v.union(
            v.literal("equals"),
            v.literal("contains"),
            v.literal("greater_than"),
          ),
          value: v.string(),
        }),
      ),
    ),
    actions: v.optional(
      v.array(
        v.object({
          type: v.union(
            v.literal("send_sms"),
            v.literal("send_email"),
            v.literal("delay"),
            v.literal("tag"),
            v.literal("conditional"),
          ),
          config: v.any(),
          order: v.number(),
        }),
      ),
    ),
    blocks: v.optional(
      v.array(
        v.object({
          id: v.string(),
          type: v.string(),
          position: v.object({
            x: v.number(),
            y: v.number(),
          }),
          width: v.number(),
          height: v.number(),
          config: v.any(),
        }),
      ),
    ),
    connections: v.optional(
      v.array(
        v.object({
          id: v.string(),
          from: v.string(),
          to: v.string(),
          fromPort: v.string(),
          toPort: v.string(),
        }),
      ),
    ),
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

// Create default workflow templates for new organizations
export const createDefaultTemplates = mutation({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Template 1: Appointment Confirmation
    await ctx.db.insert("workflows", {
      orgId: args.orgId,
      name: "Appointment Confirmation",
      description: "Send confirmation message when appointment is booked",
      trigger: "appointment_scheduled",
      conditions: [],
      actions: [
        {
          type: "send_sms",
          config: {
            message: "Hi {client_name}! Your appointment on {appointment_date} at {appointment_time} has been confirmed. We look forward to seeing you!"
          },
          order: 0
        }
      ],
      blocks: [
        {
          id: "trigger-1",
          type: "trigger",
          position: { x: 100, y: 100 },
          width: 200,
          height: 100,
          config: { trigger: "appointment_booked" }
        },
        {
          id: "action-1", 
          type: "action",
          position: { x: 400, y: 100 },
          width: 200,
          height: 100,
          config: { 
            action: "send_sms",
            message: "Hi {client_name}! Your appointment on {appointment_date} at {appointment_time} has been confirmed. We look forward to seeing you!"
          }
        }
      ],
      connections: [
        {
          id: "conn-1",
          from: "trigger-1",
          to: "action-1",
          fromPort: "out",
          toPort: "in"
        }
      ],
      status: "active",
      preventDuplicates: true,
      duplicatePreventionDays: 30,
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Template 2: 6-Month Follow-up
    await ctx.db.insert("workflows", {
      orgId: args.orgId,
      name: "6-Month Follow-up",
      description: "Follow up with clients after 6 months",
      trigger: "appointment_completed",
      conditions: [],
      actions: [
        {
          type: "delay",
          config: { duration: 6, unit: "months" },
          order: 0
        },
        {
          type: "send_sms",
          config: {
            message: "Hi {client_name}! It's been 6 months since your last visit. We'd love to see you again! Book your next appointment: {booking_link}"
          },
          order: 1
        }
      ],
      blocks: [
        {
          id: "trigger-2",
          type: "trigger",
          position: { x: 100, y: 100 },
          width: 200,
          height: 100,
          config: { trigger: "appointment_completed" }
        },
        {
          id: "delay-1",
          type: "delay", 
          position: { x: 400, y: 100 },
          width: 200,
          height: 100,
          config: { duration: 6, unit: "months" }
        },
        {
          id: "action-2",
          type: "action",
          position: { x: 700, y: 100 },
          width: 200,
          height: 100,
          config: {
            action: "send_sms",
            message: "Hi {client_name}! It's been 6 months since your last visit. We'd love to see you again! Book your next appointment: {booking_link}"
          }
        }
      ],
      connections: [
        {
          id: "conn-2",
          from: "trigger-2", 
          to: "delay-1",
          fromPort: "out",
          toPort: "in"
        },
        {
          id: "conn-3",
          from: "delay-1",
          to: "action-2", 
          fromPort: "out",
          toPort: "in"
        }
      ],
      status: "active",
      preventDuplicates: true,
      duplicatePreventionDays: 30,
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Template 3: Google Review Request
    await ctx.db.insert("workflows", {
      orgId: args.orgId,
      name: "Google Review Request",
      description: "Request Google review after appointment completion",
      trigger: "appointment_completed",
      conditions: [],
      actions: [
        {
          type: "delay",
          config: { duration: 2, unit: "hours" },
          order: 0
        },
        {
          type: "send_email",
          config: {
            subject: "How was your experience?",
            message: "Hi {client_name}, thanks for visiting us today! We'd love to hear about your experience. Please leave us a review on Google: {google_review_link}"
          },
          order: 1
        }
      ],
      blocks: [
        {
          id: "trigger-3",
          type: "trigger",
          position: { x: 100, y: 100 },
          width: 200,
          height: 100,
          config: { trigger: "appointment_completed" }
        },
        {
          id: "delay-2",
          type: "delay",
          position: { x: 400, y: 100 },
          width: 200,
          height: 100,
          config: { duration: 2, unit: "hours" }
        },
        {
          id: "action-3",
          type: "action",
          position: { x: 700, y: 100 },
          width: 200,
          height: 100,
          config: {
            action: "send_email",
            subject: "How was your experience?",
            message: "Hi {client_name}, thanks for visiting us today! We'd love to hear about your experience. Please leave us a review on Google: {google_review_link}"
          }
        }
      ],
      connections: [
        {
          id: "conn-4",
          from: "trigger-3",
          to: "delay-2",
          fromPort: "out", 
          toPort: "in"
        },
        {
          id: "conn-5",
          from: "delay-2",
          to: "action-3",
          fromPort: "out",
          toPort: "in" 
        }
      ],
      status: "active",
      preventDuplicates: true,
      duplicatePreventionDays: 30,
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      isActive: false, // Start inactive for this template
      createdAt: now,
      updatedAt: now,
    });

    return true;
  },
});

// Get user tracking data for workflow nodes
export const getNodeUserTracking = query({
  args: { 
    workflowId: v.id("workflows"),
    nodeId: v.string()
  },
  handler: async (ctx, args) => {
    // Get workflow runs for this specific node
    const workflowRuns = await ctx.db
      .query("workflowRuns")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .filter((q) => q.eq(q.field("currentNodeId"), args.nodeId))
      .collect();

    // Get unique users currently at this node
    const uniqueUserIds = [...new Set(workflowRuns.map(run => run.clientId))];

    return {
      userCount: uniqueUserIds.length,
      users: workflowRuns.slice(0, 10) // Return first 10 for display
    };
  },
});

// Get all user tracking data for a workflow
export const getWorkflowUserTracking = query({
  args: { workflowId: v.id("workflows") },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow || !workflow.blocks) return {};

    const nodeTracking: Record<string, { userCount: number; users: any[] }> = {};

    for (const block of workflow.blocks) {
      // Get workflow runs for this node
      const workflowRuns = await ctx.db
        .query("workflowRuns")
        .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
        .filter((q) => q.eq(q.field("currentNodeId"), block.id))
        .collect();

      // Get unique users currently at this node
      const uniqueUserIds = [...new Set(workflowRuns.map(run => run.clientId))];

      nodeTracking[block.id] = {
        userCount: uniqueUserIds.length,
        users: workflowRuns.slice(0, 5) // Limit for performance
      };
    }

    return nodeTracking;
  },
});
