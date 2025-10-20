import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { calendarConnections, orgs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

// Schema for calendar connection creation
const createCalendarConnectionSchema = z.object({
  calendarId: z.string().min(1, "Calendar ID is required"),
  calendarName: z.string().min(1, "Calendar name is required"),
  ownerEmail: z.string().email("Valid email required"),
  accessToken: z.string().min(1, "Access token is required"),
  refreshToken: z.string().optional(),
  webhookId: z.string().optional(),
});

// GET /api/calendars - List all calendar connections for organization
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const connections = await db
      .select({
        id: calendarConnections.id,
        calendarId: calendarConnections.calendarId,
        calendarName: calendarConnections.calendarName,
        ownerEmail: calendarConnections.ownerEmail,
        isActive: calendarConnections.isActive,
        lastSyncAt: calendarConnections.lastSyncAt,
        createdAt: calendarConnections.createdAt,
        updatedAt: calendarConnections.updatedAt,
      })
      .from(calendarConnections)
      .where(eq(calendarConnections.orgId, session.user.orgId));

    return NextResponse.json({ 
      connections,
      total: connections.length 
    });

  } catch (error) {
    console.error("Error fetching calendar connections:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar connections" },
      { status: 500 }
    );
  }
}

// POST /api/calendars - Create new calendar connection
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
    const validatedData = createCalendarConnectionSchema.parse(body);

    // Check if calendar connection already exists for this org
    const existingConnection = await db
      .select()
      .from(calendarConnections)
      .where(
        and(
          eq(calendarConnections.orgId, session.user.orgId),
          eq(calendarConnections.calendarId, validatedData.calendarId)
        )
      )
      .limit(1);

    if (existingConnection.length > 0) {
      return NextResponse.json(
        { error: "Calendar connection already exists" },
        { status: 409 }
      );
    }

    // TODO: Encrypt access token and refresh token before storing
    const newConnection = await db
      .insert(calendarConnections)
      .values({
        orgId: session.user.orgId,
        calendarId: validatedData.calendarId,
        calendarName: validatedData.calendarName,
        ownerEmail: validatedData.ownerEmail,
        accessToken: validatedData.accessToken, // TODO: Encrypt
        refreshToken: validatedData.refreshToken, // TODO: Encrypt
        webhookId: validatedData.webhookId,
        isActive: true,
      });

    return NextResponse.json(
      {
        message: "Calendar connection created successfully",
        connectionId: newConnection.insertId,
      },
      { status: 201 }
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating calendar connection:", error);
    return NextResponse.json(
      { error: "Failed to create calendar connection" },
      { status: 500 }
    );
  }
}