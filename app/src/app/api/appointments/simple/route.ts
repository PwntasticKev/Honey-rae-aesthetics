import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appointments, clients } from "@/db/schema";
import { eq, desc, gte, lte } from "drizzle-orm";

// GET /api/appointments/simple - Get appointments (no auth for testing)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = parseInt(searchParams.get('orgId') || '1'); // Default to org 1 for testing
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query with filters
    let whereConditions = [eq(appointments.orgId, orgId)];

    if (startDate) {
      whereConditions.push(gte(appointments.dateTime, new Date(startDate)));
    }

    if (endDate) {
      whereConditions.push(lte(appointments.dateTime, new Date(endDate)));
    }

    // Get appointments with client information
    const appointmentList = await db
      .select({
        appointment: appointments,
        client: {
          id: clients.id,
          fullName: clients.fullName,
          email: clients.email,
          phones: clients.phones,
        },
      })
      .from(appointments)
      .leftJoin(clients, eq(appointments.clientId, clients.id))
      .where(eq(appointments.orgId, orgId))
      .orderBy(desc(appointments.dateTime))
      .limit(50);

    return NextResponse.json({
      appointments: appointmentList.map(item => ({
        ...item.appointment,
        client: item.client,
      })),
      total: appointmentList.length,
      message: "Appointments retrieved successfully (no auth)",
      calendarIntegration: "Google Calendar setup required for full functionality"
    });

  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments", details: String(error) },
      { status: 500 }
    );
  }
}