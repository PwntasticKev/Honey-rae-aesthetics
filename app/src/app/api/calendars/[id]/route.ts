import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { calendarConnections } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

// Schema for calendar connection updates
const updateCalendarConnectionSchema = z.object({
  calendarName: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  webhookId: z.string().optional(),
});

// GET /api/calendars/[id] - Get specific calendar connection
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const connectionId = parseInt(params.id);
    if (isNaN(connectionId)) {
      return NextResponse.json(
        { error: "Invalid connection ID" },
        { status: 400 }
      );
    }

    const connection = await db
      .select({
        id: calendarConnections.id,
        calendarId: calendarConnections.calendarId,
        calendarName: calendarConnections.calendarName,
        ownerEmail: calendarConnections.ownerEmail,
        isActive: calendarConnections.isActive,
        webhookId: calendarConnections.webhookId,
        lastSyncAt: calendarConnections.lastSyncAt,
        createdAt: calendarConnections.createdAt,
        updatedAt: calendarConnections.updatedAt,
        // Note: We don't return access/refresh tokens for security
      })
      .from(calendarConnections)
      .where(
        and(
          eq(calendarConnections.id, connectionId),
          eq(calendarConnections.orgId, session.user.orgId)
        )
      )
      .limit(1);

    if (connection.length === 0) {
      return NextResponse.json(
        { error: "Calendar connection not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ connection: connection[0] });

  } catch (error) {
    console.error("Error fetching calendar connection:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar connection" },
      { status: 500 }
    );
  }
}

// PATCH /api/calendars/[id] - Update calendar connection
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const connectionId = parseInt(params.id);
    if (isNaN(connectionId)) {
      return NextResponse.json(
        { error: "Invalid connection ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateCalendarConnectionSchema.parse(body);

    // Check if connection exists and belongs to this org
    const existingConnection = await db
      .select()
      .from(calendarConnections)
      .where(
        and(
          eq(calendarConnections.id, connectionId),
          eq(calendarConnections.orgId, session.user.orgId)
        )
      )
      .limit(1);

    if (existingConnection.length === 0) {
      return NextResponse.json(
        { error: "Calendar connection not found" },
        { status: 404 }
      );
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (validatedData.calendarName !== undefined) {
      updateData.calendarName = validatedData.calendarName;
    }
    if (validatedData.isActive !== undefined) {
      updateData.isActive = validatedData.isActive;
    }
    if (validatedData.accessToken !== undefined) {
      updateData.accessToken = validatedData.accessToken; // TODO: Encrypt
    }
    if (validatedData.refreshToken !== undefined) {
      updateData.refreshToken = validatedData.refreshToken; // TODO: Encrypt
    }
    if (validatedData.webhookId !== undefined) {
      updateData.webhookId = validatedData.webhookId;
    }

    // Update last sync time when tokens are refreshed
    if (validatedData.accessToken || validatedData.refreshToken) {
      updateData.lastSyncAt = new Date();
    }

    await db
      .update(calendarConnections)
      .set(updateData)
      .where(eq(calendarConnections.id, connectionId));

    return NextResponse.json({
      message: "Calendar connection updated successfully",
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating calendar connection:", error);
    return NextResponse.json(
      { error: "Failed to update calendar connection" },
      { status: 500 }
    );
  }
}

// DELETE /api/calendars/[id] - Delete calendar connection
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const connectionId = parseInt(params.id);
    if (isNaN(connectionId)) {
      return NextResponse.json(
        { error: "Invalid connection ID" },
        { status: 400 }
      );
    }

    // Check if connection exists and belongs to this org
    const existingConnection = await db
      .select()
      .from(calendarConnections)
      .where(
        and(
          eq(calendarConnections.id, connectionId),
          eq(calendarConnections.orgId, session.user.orgId)
        )
      )
      .limit(1);

    if (existingConnection.length === 0) {
      return NextResponse.json(
        { error: "Calendar connection not found" },
        { status: 404 }
      );
    }

    // TODO: Cancel Google Calendar webhook before deleting
    // TODO: Clean up any related sync logs and appointment sync statuses

    await db
      .delete(calendarConnections)
      .where(eq(calendarConnections.id, connectionId));

    return NextResponse.json({
      message: "Calendar connection deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting calendar connection:", error);
    return NextResponse.json(
      { error: "Failed to delete calendar connection" },
      { status: 500 }
    );
  }
}