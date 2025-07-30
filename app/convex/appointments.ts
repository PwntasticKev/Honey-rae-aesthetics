import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { appointmentService } from "../src/lib/appointmentService";

// Create a new appointment and trigger workflows
export const create = mutation({
  args: {
    orgId: v.id("orgs"),
    clientId: v.id("clients"),
    service: v.string(),
    startTime: v.number(), // Unix timestamp
    endTime: v.number(), // Unix timestamp
    notes: v.optional(v.string()),
    location: v.optional(v.string()),
    provider: v.string(),
  },
  handler: async (ctx, args) => {
    // Get client details
    const client = await ctx.db.get(args.clientId);
    if (!client) {
      throw new Error("Client not found");
    }

    // Create appointment data
    const appointmentData = {
      clientId: args.clientId,
      clientName: client.fullName,
      clientEmail: client.email || "",
      clientPhone: client.phones[0] || "",
      service: args.service,
      startTime: new Date(args.startTime),
      endTime: new Date(args.endTime),
      notes: args.notes,
      location: args.location,
    };

    // Create appointment using the service
    const result = await appointmentService.createAppointment(appointmentData);

    if (!result.success) {
      throw new Error(result.error || "Failed to create appointment");
    }

    // Store appointment in database
    const appointmentId = await ctx.db.insert("appointments", {
      orgId: args.orgId,
      clientId: args.clientId,
      dateTime: args.startTime,
      type: args.service,
      provider: args.provider,
      notes: args.notes,
      googleEventId: result.calendarEventId,
      status: "scheduled",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      success: true,
      appointmentId,
      calendarEventId: result.calendarEventId,
    };
  },
});

// Mark appointment as completed
export const complete = mutation({
  args: {
    appointmentId: v.id("appointments"),
  },
  handler: async (ctx, args) => {
    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Update appointment status
    await ctx.db.patch(args.appointmentId, {
      status: "completed",
      updatedAt: Date.now(),
    });

    // Trigger workflow completion
    const result = await appointmentService.completeAppointment(
      args.appointmentId,
    );

    if (!result.success) {
      console.error("Failed to trigger completion workflows:", result.error);
    }

    return { success: true };
  },
});

// Get appointments for an organization
export const listByOrg = query({
  args: {
    orgId: v.id("orgs"),
    status: v.optional(
      v.union(
        v.literal("scheduled"),
        v.literal("completed"),
        v.literal("cancelled"),
        v.literal("no_show"),
      ),
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("appointments")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    if (args.startDate || args.endDate) {
      query = query.filter((q) => {
        let filter = q.gte(q.field("dateTime"), args.startDate || 0);
        if (args.endDate) {
          filter = q.and(filter, q.lte(q.field("dateTime"), args.endDate));
        }
        return filter;
      });
    }

    const appointments = await query.collect();

    // Get client details for each appointment
    const appointmentsWithClients = await Promise.all(
      appointments.map(async (appointment) => {
        const client = await ctx.db.get(appointment.clientId);
        return {
          ...appointment,
          client: client
            ? {
                id: client._id,
                name: client.fullName,
                email: client.email,
                phone: client.phones[0],
              }
            : null,
        };
      }),
    );

    return appointmentsWithClients;
  },
});

// Get appointments for a specific client
export const listByClient = query({
  args: {
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .collect();

    return appointments;
  },
});

// Get upcoming appointments
export const getUpcoming = query({
  args: {
    orgId: v.id("orgs"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const endDate = now + (args.days || 7) * 24 * 60 * 60 * 1000;

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "scheduled"),
          q.gte(q.field("dateTime"), now),
          q.lte(q.field("dateTime"), endDate),
        ),
      )
      .order("asc")
      .collect();

    // Get client details
    const appointmentsWithClients = await Promise.all(
      appointments.map(async (appointment) => {
        const client = await ctx.db.get(appointment.clientId);
        return {
          ...appointment,
          client: client
            ? {
                id: client._id,
                name: client.fullName,
                email: client.email,
                phone: client.phones[0],
              }
            : null,
        };
      }),
    );

    return appointmentsWithClients;
  },
});

// Cancel an appointment
export const cancel = mutation({
  args: {
    appointmentId: v.id("appointments"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Update appointment status
    await ctx.db.patch(args.appointmentId, {
      status: "cancelled",
      notes: args.reason
        ? `${appointment.notes || ""}\nCancelled: ${args.reason}`
        : appointment.notes,
      updatedAt: Date.now(),
    });

    // TODO: Cancel Google Calendar event if it exists
    if (appointment.googleEventId) {
      // await googleCalendarService.deleteEvent("primary", appointment.googleEventId);
    }

    return { success: true };
  },
});

// Sync appointments from Google Calendar
export const syncFromGoogleCalendar = mutation({
  args: {
    orgId: v.id("orgs"),
    providerId: v.id("googleCalendarProviders"),
  },
  handler: async (ctx, args) => {
    // TODO: Implement Google Calendar sync
    // 1. Get provider details
    // 2. Fetch events from Google Calendar
    // 3. Create/update appointments in database
    // 4. Update last sync timestamp

    return { success: true, syncedCount: 0 };
  },
});
