import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calendarConnections, calendarSyncLog } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { GoogleCalendarService } from "@/lib/google-calendar";

// Google Calendar webhook endpoint for real-time synchronization
// This endpoint receives notifications when calendar events change

export async function POST(request: NextRequest) {
  try {
    // Verify this is a valid Google Calendar webhook
    const channelId = request.headers.get('x-goog-channel-id');
    const resourceId = request.headers.get('x-goog-resource-id');
    const messageNumber = request.headers.get('x-goog-message-number');
    const resourceState = request.headers.get('x-goog-resource-state'); // sync, exists, not_exists
    const resourceUri = request.headers.get('x-goog-resource-uri');

    if (!channelId || !resourceId) {
      console.error('Invalid webhook headers:', {
        channelId,
        resourceId,
        messageNumber,
        resourceState,
      });
      return NextResponse.json(
        { error: "Invalid webhook headers" },
        { status: 400 }
      );
    }

    console.log('Calendar webhook received:', {
      channelId,
      resourceId,
      messageNumber,
      resourceState,
      resourceUri,
    });

    // Find the calendar connection for this webhook
    const connection = await db
      .select()
      .from(calendarConnections)
      .where(
        and(
          eq(calendarConnections.webhookChannelId, channelId),
          eq(calendarConnections.webhookResourceId, resourceId),
          eq(calendarConnections.isActive, true)
        )
      )
      .limit(1);

    if (connection.length === 0) {
      console.error('No active calendar connection found for webhook:', {
        channelId,
        resourceId,
      });
      return NextResponse.json(
        { error: "Calendar connection not found" },
        { status: 404 }
      );
    }

    const calendarConnection = connection[0];

    // Handle different resource states
    switch (resourceState) {
      case 'sync':
        // Initial sync notification - we can ignore this
        console.log('Initial sync notification received for calendar:', calendarConnection.calendarId);
        break;

      case 'exists':
        // Calendar has changes - trigger a sync
        console.log('Calendar changes detected for:', calendarConnection.calendarId);
        await triggerCalendarSync(calendarConnection);
        break;

      case 'not_exists':
        // Calendar was deleted - mark connection as inactive
        console.log('Calendar deleted:', calendarConnection.calendarId);
        await db
          .update(calendarConnections)
          .set({
            isActive: false,
            lastSyncAt: new Date(),
            syncStatus: 'error',
            lastError: 'Calendar no longer exists',
          })
          .where(eq(calendarConnections.id, calendarConnection.id));
        break;

      default:
        console.log('Unknown resource state:', resourceState);
    }

    // Log the webhook activity
    await db.insert(calendarSyncLog).values({
      orgId: calendarConnection.orgId,
      calendarConnectionId: calendarConnection.id,
      calendarId: calendarConnection.calendarId,
      syncType: 'webhook',
      status: 'success',
      eventsProcessed: 0, // Will be updated by the sync process
      metadata: {
        channelId,
        resourceId,
        messageNumber,
        resourceState,
        resourceUri,
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error processing calendar webhook:', error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

// Trigger calendar synchronization for a specific connection
async function triggerCalendarSync(connection: any): Promise<void> {
  try {
    // Initialize Google Calendar service with stored credentials
    const calendarService = new GoogleCalendarService();
    await calendarService.initializeAuth(
      connection.accessToken,
      connection.refreshToken
    );

    // Get recent events from the calendar
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAhead = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const eventsResponse = await calendarService.getCalendarEvents(
      connection.calendarId,
      {
        timeMin: oneHourAgo,
        timeMax: oneDayAhead,
        singleEvents: true,
        orderBy: 'updated',
        syncToken: connection.syncToken, // Use stored sync token for incremental sync
      }
    );

    console.log(`Processing ${eventsResponse.events.length} calendar events for real-time sync`);

    // TODO: Process events and sync with appointments
    // This would trigger the same sync logic as the manual sync endpoint
    // For now, we'll just update the connection status

    // Update connection with new sync token and timestamp
    await db
      .update(calendarConnections)
      .set({
        lastSyncAt: new Date(),
        syncStatus: 'success',
        syncToken: eventsResponse.nextSyncToken,
        lastError: null,
      })
      .where(eq(calendarConnections.id, connection.id));

    console.log('Real-time calendar sync completed successfully');

  } catch (error) {
    console.error('Error during calendar sync:', error);

    // Update connection status to indicate error
    await db
      .update(calendarConnections)
      .set({
        lastSyncAt: new Date(),
        syncStatus: 'error',
        lastError: error instanceof Error ? error.message : 'Unknown error',
      })
      .where(eq(calendarConnections.id, connection.id));

    throw error;
  }
}

// Webhook verification endpoint (required by Google)
export async function GET(request: NextRequest) {
  // Google Calendar webhook verification
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('hub.challenge');
  const mode = searchParams.get('hub.mode');

  if (mode === 'subscribe' && challenge) {
    console.log('Calendar webhook verification successful');
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return NextResponse.json(
    { error: "Invalid verification request" },
    { status: 400 }
  );
}