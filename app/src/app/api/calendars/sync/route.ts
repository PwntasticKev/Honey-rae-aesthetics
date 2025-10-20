import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  calendarConnections,
  calendarSyncLog,
  appointments,
  clients,
  appointmentSyncStatus,
  potentialDuplicates,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

// Schema for manual sync request
const syncRequestSchema = z.object({
  calendarId: z.string().optional(), // If not provided, sync all calendars
  forceSync: z.boolean().default(false), // Force sync even if recently synced
});

// Interface for Google Calendar Event (simplified)
interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  attendees?: Array<{
    email?: string;
    displayName?: string;
  }>;
  description?: string;
  status: string; // 'confirmed', 'cancelled', etc.
  updated: string;
}

// POST /api/calendars/sync - Trigger calendar synchronization
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { calendarId, forceSync } = syncRequestSchema.parse(body);

    // Get calendar connections to sync
    let connectionsToSync;
    if (calendarId) {
      connectionsToSync = await db
        .select()
        .from(calendarConnections)
        .where(
          and(
            eq(calendarConnections.orgId, session.user.orgId),
            eq(calendarConnections.calendarId, calendarId),
            eq(calendarConnections.isActive, true)
          )
        );
    } else {
      connectionsToSync = await db
        .select()
        .from(calendarConnections)
        .where(
          and(
            eq(calendarConnections.orgId, session.user.orgId),
            eq(calendarConnections.isActive, true)
          )
        );
    }

    if (connectionsToSync.length === 0) {
      return NextResponse.json(
        { error: "No active calendar connections found" },
        { status: 404 }
      );
    }

    const syncResults = [];

    for (const connection of connectionsToSync) {
      try {
        // Check if recent sync exists (unless force sync)
        if (!forceSync) {
          const recentSync = await db
            .select()
            .from(calendarSyncLog)
            .where(
              and(
                eq(calendarSyncLog.orgId, session.user.orgId),
                eq(calendarSyncLog.calendarId, connection.calendarId)
              )
            )
            .orderBy(desc(calendarSyncLog.syncedAt))
            .limit(1);

          // Skip if synced in last 5 minutes
          if (recentSync.length > 0) {
            const lastSync = new Date(recentSync[0].syncedAt);
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            if (lastSync > fiveMinutesAgo) {
              syncResults.push({
                calendarId: connection.calendarId,
                status: "skipped",
                message: "Recently synced",
              });
              continue;
            }
          }
        }

        // Perform the actual sync
        const syncResult = await syncCalendarEvents(connection);
        syncResults.push({
          calendarId: connection.calendarId,
          status: syncResult.status,
          message: syncResult.message,
          eventsProcessed: syncResult.eventsProcessed,
        });

      } catch (error) {
        console.error(`Sync error for calendar ${connection.calendarId}:`, error);
        syncResults.push({
          calendarId: connection.calendarId,
          status: "failed",
          message: "Sync failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      message: "Calendar sync completed",
      results: syncResults,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error in calendar sync:", error);
    return NextResponse.json(
      { error: "Calendar sync failed" },
      { status: 500 }
    );
  }
}

// Helper function to sync calendar events
async function syncCalendarEvents(connection: any) {
  let eventsProcessed = 0;
  let eventsCreated = 0;
  let eventsUpdated = 0;
  let errors: string[] = [];

  try {
    // TODO: Implement actual Google Calendar API calls
    // For now, this is a placeholder implementation
    
    // Step 1: Fetch events from Google Calendar
    const calendarEvents = await fetchGoogleCalendarEvents(connection);
    
    // Step 2: Process each event
    for (const event of calendarEvents) {
      try {
        await processCalendarEvent(event, connection);
        eventsProcessed++;
      } catch (error) {
        errors.push(`Event ${event.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Step 3: Log the sync
    await db.insert(calendarSyncLog).values({
      orgId: connection.orgId,
      calendarId: connection.calendarId,
      eventsProcessed,
      eventsCreated,
      eventsUpdated,
      errors: errors.length > 0 ? errors : null,
      status: errors.length === 0 ? "success" : (eventsProcessed > 0 ? "partial" : "failed"),
    });

    // Step 4: Update connection's last sync time
    await db
      .update(calendarConnections)
      .set({ lastSyncAt: new Date() })
      .where(eq(calendarConnections.id, connection.id));

    return {
      status: errors.length === 0 ? "success" : "partial",
      message: `Processed ${eventsProcessed} events`,
      eventsProcessed,
    };

  } catch (error) {
    // Log failed sync
    await db.insert(calendarSyncLog).values({
      orgId: connection.orgId,
      calendarId: connection.calendarId,
      eventsProcessed: 0,
      eventsCreated: 0,
      eventsUpdated: 0,
      errors: [error instanceof Error ? error.message : 'Sync failed'],
      status: "failed",
    });

    throw error;
  }
}

// TODO: Implement Google Calendar API integration
async function fetchGoogleCalendarEvents(connection: any): Promise<GoogleCalendarEvent[]> {
  // This is a placeholder - will implement Google Calendar API calls
  console.log(`Would fetch events from calendar ${connection.calendarId}`);
  
  // For now, return mock data for testing
  return [
    {
      id: "mock-event-1",
      summary: "Botox Appointment - Sarah Johnson",
      start: { dateTime: new Date().toISOString() },
      end: { dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString() },
      status: "confirmed",
      updated: new Date().toISOString(),
      description: "Botox treatment appointment",
    },
  ];
}

// Process individual calendar event
async function processCalendarEvent(event: GoogleCalendarEvent, connection: any) {
  // Extract client name from event summary
  const clientName = extractClientNameFromSummary(event.summary);
  if (!clientName) {
    throw new Error("Could not extract client name from event");
  }

  // Try to find matching client using smart matching
  const matchedClient = await findOrCreateClient(clientName, connection.orgId, event);

  // Create or update appointment
  const appointmentData = {
    orgId: connection.orgId,
    clientId: matchedClient.id,
    providerId: 1, // TODO: Determine provider from calendar or event
    service: extractServiceFromSummary(event.summary),
    dateTime: new Date(event.start.dateTime || event.start.date!),
    duration: calculateDuration(event.start, event.end),
    status: event.status === 'confirmed' ? 'confirmed' as const : 'scheduled' as const,
    price: 0, // TODO: Extract price if available
    notes: event.description || null,
  };

  // Check if appointment already exists
  const existingAppointment = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.orgId, connection.orgId),
        eq(appointments.clientId, matchedClient.id)
        // TODO: Add date/time matching logic
      )
    )
    .limit(1);

  let appointmentId: number;

  if (existingAppointment.length > 0) {
    // Update existing appointment
    await db
      .update(appointments)
      .set(appointmentData)
      .where(eq(appointments.id, existingAppointment[0].id));
    appointmentId = existingAppointment[0].id;
  } else {
    // Create new appointment
    const result = await db.insert(appointments).values(appointmentData);
    appointmentId = result.insertId;
  }

  // Create or update appointment sync status
  await db
    .insert(appointmentSyncStatus)
    .values({
      appointmentId,
      calendarEventId: event.id,
      calendarId: connection.calendarId,
      syncStatus: "synced",
      syncDirection: "calendar_to_db",
    })
    .onDuplicateKeyUpdate({
      lastSyncedAt: new Date(),
      syncStatus: "synced",
    });
}

// Helper functions
function extractClientNameFromSummary(summary: string): string | null {
  // Simple extraction - look for name after dash or hyphen
  const match = summary.match(/[-–]\s*(.+)$/);
  return match ? match[1].trim() : null;
}

function extractServiceFromSummary(summary: string): string {
  // Extract service type from beginning of summary
  const servicePart = summary.split(/[-–]/)[0].trim();
  return servicePart || "General Appointment";
}

function calculateDuration(start: any, end: any): number {
  const startTime = new Date(start.dateTime || start.date).getTime();
  const endTime = new Date(end.dateTime || end.date).getTime();
  return Math.round((endTime - startTime) / (1000 * 60)); // Duration in minutes
}

// Smart client matching and creation
async function findOrCreateClient(clientName: string, orgId: number, event: GoogleCalendarEvent) {
  // TODO: Implement sophisticated matching algorithm
  // For now, simple name matching
  const existingClients = await db
    .select()
    .from(clients)
    .where(eq(clients.orgId, orgId));

  // Simple fuzzy matching on full name
  for (const client of existingClients) {
    if (client.fullName.toLowerCase().includes(clientName.toLowerCase()) ||
        clientName.toLowerCase().includes(client.fullName.toLowerCase())) {
      return client;
    }
  }

  // No match found, create new client
  const newClient = await db.insert(clients).values({
    orgId,
    fullName: clientName,
    email: event.attendees?.[0]?.email || `${clientName.replace(/\s+/g, '').toLowerCase()}@unknown.com`,
    phones: [], // Will be added during check-in if needed
    gender: "Unknown", // Required field
    referralSource: "Calendar Import",
    clientPortalStatus: "inactive",
    notes: `Auto-created from calendar event: ${event.summary}`,
  });

  return {
    id: newClient.insertId,
    fullName: clientName,
    email: event.attendees?.[0]?.email || `${clientName.replace(/\s+/g, '').toLowerCase()}@unknown.com`,
    orgId,
  };
}

// GET /api/calendars/sync - Get sync status and logs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const calendarId = searchParams.get('calendarId');

    // Build query conditions
    let whereCondition = eq(calendarSyncLog.orgId, session.user.orgId);
    if (calendarId) {
      whereCondition = and(whereCondition, eq(calendarSyncLog.calendarId, calendarId));
    }

    const syncLogs = await db
      .select()
      .from(calendarSyncLog)
      .where(whereCondition)
      .orderBy(desc(calendarSyncLog.syncedAt))
      .limit(Math.min(limit, 100)); // Cap at 100

    return NextResponse.json({
      syncLogs,
      total: syncLogs.length,
    });

  } catch (error) {
    console.error("Error fetching sync logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch sync logs" },
      { status: 500 }
    );
  }
}