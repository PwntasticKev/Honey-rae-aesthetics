import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
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
