import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

// Google Calendar Provider Management
export const createProvider = mutation({
  args: {
    orgId: v.id("orgs"),
    name: v.string(),
    email: v.string(),
    color: v.string(),
    googleCalendarId: v.optional(v.string()),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const providerId = await ctx.db.insert("googleCalendarProviders", {
      ...args,
      isConnected: false,
      lastSync: undefined,
      createdAt: now,
      updatedAt: now,
    });
    return providerId;
  },
});

export const getProviders = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("googleCalendarProviders")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .order("asc")
      .collect();
  },
});

export const updateProvider = mutation({
  args: {
    id: v.id("googleCalendarProviders"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    color: v.optional(v.string()),
    isConnected: v.optional(v.boolean()),
    googleCalendarId: v.optional(v.string()),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    lastSync: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const deleteProvider = mutation({
  args: { id: v.id("googleCalendarProviders") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Google Calendar Events Management
export const syncGoogleEvents = mutation({
  args: {
    orgId: v.id("orgs"),
    providerId: v.id("googleCalendarProviders"),
    events: v.array(
      v.object({
        googleEventId: v.string(),
        summary: v.string(),
        description: v.optional(v.string()),
        startTime: v.number(),
        endTime: v.number(),
        attendees: v.optional(v.array(v.string())),
        organizer: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let eventsAdded = 0;
    let eventsUpdated = 0;

    for (const event of args.events) {
      // Check if event already exists
      const existingEvent = await ctx.db
        .query("appointments")
        .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
        .filter((q: any) => q.eq(q.field("googleEventId"), event.googleEventId))
        .first();

      if (existingEvent) {
        // Update existing event
        await ctx.db.patch(existingEvent._id, {
          dateTime: event.startTime,
          type: extractAppointmentType(event.summary),
          notes: event.description,
          updatedAt: now,
        });
        eventsUpdated++;
      } else {
        // Create new appointment from Google event
        await ctx.db.insert("appointments", {
          orgId: args.orgId,
          clientId: await getOrCreateClientFromEvent(ctx, args.orgId, event),
          dateTime: event.startTime,
          type: extractAppointmentType(event.summary),
          provider: await getProviderName(ctx, args.providerId),
          notes: event.description,
          googleEventId: event.googleEventId,
          status: "scheduled",
          createdAt: now,
          updatedAt: now,
        });
        eventsAdded++;
      }
    }

    // Update provider's last sync time
    await ctx.db.patch(args.providerId, {
      lastSync: now,
      updatedAt: now,
    });

    return { eventsAdded, eventsUpdated };
  },
});

// Helper functions
async function getOrCreateClientFromEvent(ctx: any, orgId: string, event: any) {
  // Try to find existing client by email from attendees
  if (event.attendees && event.attendees.length > 0) {
    const attendeeEmail = event.attendees[0];
    const existingClient = await ctx.db
      .query("clients")
      .withIndex("by_org", (q: any) => q.eq("orgId", orgId))
      .filter((q: any) => q.eq(q.field("email"), attendeeEmail))
      .first();

    if (existingClient) {
      return existingClient._id;
    }

    // Create new client from attendee info
    const clientName = extractClientName(event.summary, attendeeEmail);
    const clientId = await ctx.db.insert("clients", {
      orgId,
      fullName: clientName,
      email: attendeeEmail,
      gender: "other",
      phones: [],
      tags: [],
      clientPortalStatus: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return clientId;
  }

  // Fallback: create client with extracted name
  const clientName = extractClientName(event.summary, "unknown@email.com");
  const clientId = await ctx.db.insert("clients", {
    orgId,
    fullName: clientName,
    email: "unknown@email.com",
    gender: "other",
    phones: [],
    tags: [],
    clientPortalStatus: "active",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  return clientId;
}

async function getProviderName(ctx: any, providerId: string) {
  const provider = await ctx.db.get(providerId);
  return provider?.name || "Unknown Provider";
}

function extractAppointmentType(summary: string): string {
  const lowerSummary = summary.toLowerCase();
  if (lowerSummary.includes("consultation")) return "Consultation";
  if (lowerSummary.includes("treatment")) return "Treatment";
  if (lowerSummary.includes("follow-up")) return "Follow-up";
  if (lowerSummary.includes("check-in")) return "Check-in";
  return "Appointment";
}

function extractClientName(summary: string, email: string): string {
  // Try to extract client name from summary (e.g., "Sarah Johnson - Consultation")
  const nameMatch = summary.match(/^([^-]+)/);
  if (nameMatch) {
    return nameMatch[1].trim();
  }

  // Fallback to email prefix
  return email.split("@")[0];
}

// Google Calendar webhook handler for real-time appointment updates
export const handleCalendarWebhook = mutation({
  args: {
    orgId: v.id("orgs"),
    providerId: v.id("googleCalendarProviders"),
    eventId: v.string(),
    eventData: v.object({
      summary: v.string(),
      description: v.optional(v.string()),
      startDateTime: v.string(),
      endDateTime: v.string(),
      attendees: v.optional(
        v.array(
          v.object({
            email: v.string(),
            displayName: v.optional(v.string()),
          }),
        ),
      ),
      location: v.optional(v.string()),
      status: v.optional(v.string()),
    }),
    changeType: v.union(
      v.literal("created"),
      v.literal("updated"),
      v.literal("deleted"),
    ),
  },
  handler: async (ctx, args) => {
    const provider = await ctx.db.get(args.providerId);
    if (!provider) {
      throw new Error("Google Calendar provider not found");
    }

    // Handle different event changes
    switch (args.changeType) {
      case "created":
        return await handleAppointmentCreated(ctx, args);
      case "updated":
        return await handleAppointmentUpdated(ctx, args);
      case "deleted":
        return await handleAppointmentDeleted(ctx, args);
      default:
        console.log(`Unknown change type: ${args.changeType}`);
        return null;
    }
  },
});

// Handle new appointment creation from Google Calendar
async function handleAppointmentCreated(ctx: any, args: any) {
  const startDate = new Date(args.eventData.startDateTime);
  const endDate = new Date(args.eventData.endDateTime);

  // Try to find existing client by email from attendees
  let clientId = null;
  let isNewClient = false;

  if (args.eventData.attendees && args.eventData.attendees.length > 0) {
    for (const attendee of args.eventData.attendees) {
      // Skip the provider's own email
      const provider = await ctx.db.get(args.providerId);
      if (attendee.email === provider.email) continue;

      const existingClient = await ctx.db
        .query("clients")
        .withIndex("by_email", (q: any) => q.eq("email", attendee.email))
        .filter((q: any) => q.eq(q.field("orgId"), args.orgId))
        .first();

      if (existingClient) {
        clientId = existingClient._id;
        break;
      }
    }

    // If no existing client found, create a new one from the first attendee
    if (!clientId && args.eventData.attendees.length > 0) {
      const provider = await ctx.db.get(args.providerId);
      const primaryAttendee = args.eventData.attendees.find(
        (a: any) => a.email !== provider.email,
      );
      if (primaryAttendee) {
        const [firstName, ...lastNameParts] = (
          primaryAttendee.displayName || primaryAttendee.email.split("@")[0]
        ).split(" ");
        const lastName = lastNameParts.join(" ");

        clientId = await ctx.db.insert("clients", {
          orgId: args.orgId,
          fullName: primaryAttendee.displayName || firstName,
          firstName: firstName,
          lastName: lastName || undefined,
          email: primaryAttendee.email,
          phones: [],
          gender: "other", // Default since we don't know
          clientPortalStatus: "pending",
          tags: ["google_calendar_import", "needs_completion"],
          importSource: "google_calendar",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        isNewClient = true;
        console.log(
          `Created new client ${clientId} from Google Calendar appointment`,
        );

        // Create notification for incomplete client profile
        await ctx.db.insert("notifications", {
          orgId: args.orgId,
          title: "New Client Profile Needs Completion",
          message: `Client ${primaryAttendee.displayName || firstName} was auto-created from Google Calendar and needs profile completion.`,
          type: "client",
          read: false,
          actionUrl: `/clients/${clientId}`,
          actionText: "Complete Profile",
          metadata: {
            clientId,
            source: "google_calendar_import",
            appointmentTitle: args.eventData.summary,
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }
  }

  // Create appointment record if we have a client
  if (clientId) {
    const provider = await ctx.db.get(args.providerId);
    const appointmentId = await ctx.db.insert("appointments", {
      orgId: args.orgId,
      clientId,
      dateTime: startDate.getTime(),
      type: args.eventData.summary,
      provider: provider.name,
      notes: args.eventData.description,
      googleEventId: args.eventId,
      status: "scheduled",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update provider's last sync time
    await ctx.db.patch(args.providerId, {
      lastSync: Date.now(),
      updatedAt: Date.now(),
    });

    // Trigger workflow for appointment scheduled
    await triggerAppointmentWorkflows(ctx, {
      orgId: args.orgId,
      appointmentId,
      clientId,
      appointmentTitle: args.eventData.summary,
      appointmentStartTime: startDate.getTime(),
      triggerType: "appointment_scheduled",
      isNewClient,
    });

    console.log(
      `Created appointment ${appointmentId} for client ${clientId} from Google Calendar event ${args.eventId}`,
    );
    return appointmentId;
  }

  console.log(
    `Skipped appointment creation - no valid client found for event ${args.eventId}`,
  );
  return null;
}

// Handle appointment updates from Google Calendar
async function handleAppointmentUpdated(ctx: any, args: any) {
  // Find existing appointment by Google Event ID
  const appointment = await ctx.db
    .query("appointments")
    .filter((q: any) =>
      q.and(
        q.eq(q.field("orgId"), args.orgId),
        q.eq(q.field("googleEventId"), args.eventId),
      ),
    )
    .first();

  if (!appointment) {
    console.log(
      `No appointment found for Google Event ID: ${args.eventId}, creating new one`,
    );
    return await handleAppointmentCreated(ctx, args);
  }

  const startDate = new Date(args.eventData.startDateTime);
  const previousStatus = appointment.status;

  const updates: any = {
    dateTime: startDate.getTime(),
    type: args.eventData.summary,
    notes: args.eventData.description,
    updatedAt: Date.now(),
  };

  // Handle status updates
  if (args.eventData.status === "cancelled") {
    updates.status = "cancelled";
  }

  await ctx.db.patch(appointment._id, updates);

  // If appointment was marked as completed, trigger completion workflows
  if (updates.status === "completed" && previousStatus !== "completed") {
    await triggerAppointmentWorkflows(ctx, {
      orgId: args.orgId,
      appointmentId: appointment._id,
      clientId: appointment.clientId,
      appointmentTitle: args.eventData.summary,
      appointmentEndTime: new Date(args.eventData.endDateTime).getTime(),
      triggerType: "appointment_completed",
    });
  }

  console.log(
    `Updated appointment ${appointment._id} from Google Calendar event ${args.eventId}`,
  );
  return appointment._id;
}

// Handle appointment deletion from Google Calendar
async function handleAppointmentDeleted(ctx: any, args: any) {
  const appointment = await ctx.db
    .query("appointments")
    .filter((q: any) =>
      q.and(
        q.eq(q.field("orgId"), args.orgId),
        q.eq(q.field("googleEventId"), args.eventId),
      ),
    )
    .first();

  if (appointment) {
    await ctx.db.delete(appointment._id);
    console.log(
      `Deleted appointment ${appointment._id} for Google Event ID: ${args.eventId}`,
    );
    return appointment._id;
  }

  return null;
}

// Enhanced polling-based sync with workflow triggers
export const syncCalendarAppointments = action({
  args: {
    orgId: v.id("orgs"),
    providerId: v.id("googleCalendarProviders"),
  },
  handler: async (ctx, args) => {
    // For now, we'll implement a simple placeholder sync result
    // This would be replaced with actual Google Calendar API integration
    const syncResult = {
      syncedEvents: 0,
      createdAppointments: 0,
      updatedAppointments: 0,
      completedAppointments: 0,
      triggeredWorkflows: 0,
      errors: [] as string[],
      lastSync: Date.now(),
    };

    // This would integrate with Google Calendar API to:
    // 1. Fetch recent calendar events
    // 2. Create/update appointments in the database
    // 3. Check for completed appointments
    // 4. Trigger workflows for completed appointments

    console.log(
      `Calendar sync completed for provider ${args.providerId}:`,
      syncResult,
    );
    return syncResult;
  },
});

// Get calendar sync status and statistics
export const getSyncStatus = query({
  args: {
    orgId: v.id("orgs"),
  },
  handler: async (ctx, args) => {
    const providers = await ctx.db
      .query("googleCalendarProviders")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const providerStats = await Promise.all(
      providers.map(async (provider) => {
        // Get recent appointments from this provider
        const recentAppointments = await ctx.db
          .query("appointments")
          .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
          .filter((q) => q.eq(q.field("provider"), provider.name))
          .take(10);

        // Get appointment counts by status
        const scheduledCount = recentAppointments.filter(
          (a) => a.status === "scheduled",
        ).length;
        const completedCount = recentAppointments.filter(
          (a) => a.status === "completed",
        ).length;
        const cancelledCount = recentAppointments.filter(
          (a) => a.status === "cancelled",
        ).length;

        return {
          providerId: provider._id,
          name: provider.name,
          email: provider.email,
          isConnected: provider.isConnected,
          lastSync: provider.lastSync,
          status: provider.isConnected ? "connected" : "disconnected",
          stats: {
            totalAppointments: recentAppointments.length,
            scheduled: scheduledCount,
            completed: completedCount,
            cancelled: cancelledCount,
          },
        };
      }),
    );

    return providerStats;
  },
});

// Get recent calendar appointments with workflow trigger information
export const getRecentCalendarAppointments = query({
  args: {
    orgId: v.id("orgs"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("appointments")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.neq(q.field("googleEventId"), undefined))
      .order("desc");

    const appointments = args.limit
      ? await query.take(args.limit)
      : await query.collect();

    // Enrich with client details and workflow trigger information
    const enrichedAppointments = await Promise.all(
      appointments.map(async (appointment) => {
        const client = await ctx.db.get(appointment.clientId);

        // Check for related workflow triggers
        const trigger = await ctx.db
          .query("appointmentTriggers")
          .withIndex("by_appointment", (q) =>
            q.eq("appointmentId", appointment._id),
          )
          .first();

        return {
          ...appointment,
          client,
          trigger: trigger
            ? {
                appointmentType: trigger.appointmentType,
                triggeredWorkflows: trigger.triggeredWorkflows.length,
                enrollments: trigger.enrollmentIds.length,
                triggeredAt: trigger.triggeredAt,
              }
            : null,
        };
      }),
    );

    return enrichedAppointments;
  },
});

// Helper function to trigger workflows for appointments
async function triggerAppointmentWorkflows(ctx: any, data: any) {
  const {
    orgId,
    appointmentId,
    clientId,
    appointmentTitle,
    triggerType,
    isNewClient,
  } = data;

  try {
    // Extract appointment type for workflow matching
    const appointmentType = extractAppointmentTypeForWorkflow(appointmentTitle);

    // Find matching workflows
    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_org", (q: any) => q.eq("orgId", orgId))
      .filter((q: any) =>
        q.and(
          q.eq(q.field("status"), "active"),
          q.or(
            q.eq(q.field("trigger"), triggerType),
            q.eq(q.field("trigger"), appointmentType),
          ),
        ),
      )
      .collect();

    let triggeredCount = 0;
    const enrollmentIds = [];

    for (const workflow of workflows) {
      // Check for duplicate prevention
      if (workflow.preventDuplicates) {
        const cutoffTime =
          Date.now() -
          (workflow.duplicatePreventionDays || 30) * 24 * 60 * 60 * 1000;

        const recentEnrollment = await ctx.db
          .query("workflowEnrollments")
          .withIndex("by_workflow", (q: any) =>
            q.eq("workflowId", workflow._id),
          )
          .filter((q: any) =>
            q.and(
              q.eq(q.field("clientId"), clientId),
              q.gt(q.field("enrolledAt"), cutoffTime),
            ),
          )
          .first();

        if (recentEnrollment) {
          console.log(
            `⏭️ Skipping duplicate enrollment for client ${clientId} in workflow ${workflow._id}`,
          );
          continue;
        }
      }

      // Enroll client in workflow
      const enrollmentId = await ctx.db.insert("workflowEnrollments", {
        orgId,
        workflowId: workflow._id,
        clientId,
        enrollmentReason: `${triggerType}_${appointmentType}`,
        currentStatus: "active",
        enrolledAt: Date.now(),
        metadata: {
          appointmentId,
          appointmentType: appointmentTitle,
          appointmentDate: data.appointmentStartTime || data.appointmentEndTime,
          triggerType,
          isNewClient: !!isNewClient,
        },
      });

      // Log the enrollment
      await ctx.db.insert("executionLogs", {
        orgId,
        workflowId: workflow._id,
        enrollmentId,
        clientId,
        stepId: "google_calendar_trigger",
        action: "enroll_client",
        status: "executed",
        executedAt: Date.now(),
        message: `Auto-enrolled from Google Calendar: ${appointmentTitle}`,
        metadata: {
          appointmentType,
          appointmentId,
          triggerType,
          source: "google_calendar",
        },
      });

      triggeredCount++;
      enrollmentIds.push(enrollmentId);
    }

    // Record the trigger event if any workflows were triggered
    if (triggeredCount > 0) {
      await ctx.db.insert("appointmentTriggers", {
        orgId,
        appointmentId,
        clientId,
        appointmentType,
        triggeredWorkflows: workflows
          .slice(0, triggeredCount)
          .map((w: any) => w._id),
        enrollmentIds,
        triggeredAt: Date.now(),
        appointmentEndTime:
          data.appointmentEndTime || data.appointmentStartTime + 60 * 60 * 1000, // Default 1 hour duration
        metadata: {
          appointmentTitle,
          source: "google_calendar",
          triggerType,
        },
      });
    }

    console.log(
      `🚀 Triggered ${triggeredCount} workflows for appointment: ${appointmentTitle}`,
    );
    return { triggered: triggeredCount, enrollments: enrollmentIds };
  } catch (error) {
    console.error(`❌ Error triggering workflows for appointment:`, error);
    throw error;
  }
}

// Helper function to extract workflow trigger type from appointment title
function extractAppointmentTypeForWorkflow(title: string): string {
  const lowerTitle = title.toLowerCase();

  // Map appointment titles to workflow trigger types
  if (lowerTitle.includes("morpheus8") || lowerTitle.includes("morpheus")) {
    return "morpheus8";
  }
  if (
    lowerTitle.includes("botox") ||
    lowerTitle.includes("toxin") ||
    lowerTitle.includes("neurotoxin")
  ) {
    return "toxins";
  }
  if (
    lowerTitle.includes("filler") ||
    lowerTitle.includes("dermal") ||
    lowerTitle.includes("juvederm") ||
    lowerTitle.includes("restylane")
  ) {
    return "filler";
  }
  if (lowerTitle.includes("consultation") || lowerTitle.includes("consult")) {
    return "consultation";
  }

  // Default fallback
  return "appointment_scheduled";
}
