import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { appointments, clients, users } from "@/db/schema";
import { eq, and, desc, gte, lte, sql, or, like } from "drizzle-orm";
import { z } from "zod";

// Enhanced schema for creating a new appointment (aligned with database schema)
const createAppointmentSchema = z.object({
  clientId: z.number().positive("Client ID is required"),
  providerId: z.number().positive("Provider ID is required"),
  service: z.string().min(1, "Service is required"),
  dateTime: z.string().datetime("Invalid date/time"),
  duration: z.number().positive("Duration must be positive").default(60), // in minutes
  status: z.enum(["scheduled", "confirmed", "completed", "cancelled", "no_show"]).default("scheduled"),
  price: z.number().min(0, "Price must be non-negative").default(0),
  notes: z.string().optional(),
});

// Schema for appointment filtering and search
const appointmentFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["all", "scheduled", "confirmed", "completed", "cancelled", "no_show"]).optional(),
  providerId: z.number().optional(),
  clientId: z.number().optional(),
  service: z.string().optional(),
  dateRange: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
  view: z.enum(["day", "week", "month", "list"]).default("week"),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(50),
});

// Schema for updating an appointment
const updateAppointmentSchema = createAppointmentSchema.partial();

// GET /api/appointments - Get appointments with advanced filtering and calendar views
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
    const {
      search = "",
      status = "all",
      providerId,
      clientId,
      service = "",
      dateRange,
      view = "week",
      page = 1,
      limit = 50
    } = appointmentFilterSchema.parse(Object.fromEntries(searchParams));

    const offset = (page - 1) * limit;

    // Build dynamic query for appointments with client and provider details
    let appointmentQuery = db
      .select({
        id: appointments.id,
        clientId: appointments.clientId,
        providerId: appointments.providerId,
        service: appointments.service,
        dateTime: appointments.dateTime,
        duration: appointments.duration,
        status: appointments.status,
        price: appointments.price,
        notes: appointments.notes,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        // Client details
        clientName: clients.fullName,
        clientEmail: clients.email,
        clientPhones: clients.phones,
        // Provider details
        providerName: users.name,
        providerEmail: users.email,
        providerRole: users.role,
        // Calculated fields
        endTime: sql<string>`DATE_ADD(${appointments.dateTime}, INTERVAL ${appointments.duration} MINUTE)`.as('endTime'),
        dayOfWeek: sql<number>`DAYOFWEEK(${appointments.dateTime})`.as('dayOfWeek'),
      })
      .from(appointments)
      .leftJoin(clients, eq(appointments.clientId, clients.id))
      .leftJoin(users, eq(appointments.providerId, users.id))
      .where(eq(appointments.orgId, session.user.orgId));

    // Apply search filter
    if (search) {
      appointmentQuery = appointmentQuery.where(
        or(
          like(clients.fullName, `%${search}%`),
          like(clients.email, `%${search}%`),
          like(appointments.service, `%${search}%`),
          like(users.name, `%${search}%`)
        )
      );
    }

    // Apply status filter
    if (status !== "all") {
      appointmentQuery = appointmentQuery.where(eq(appointments.status, status as any));
    }

    // Apply provider filter
    if (providerId) {
      appointmentQuery = appointmentQuery.where(eq(appointments.providerId, providerId));
    }

    // Apply client filter
    if (clientId) {
      appointmentQuery = appointmentQuery.where(eq(appointments.clientId, clientId));
    }

    // Apply service filter
    if (service) {
      appointmentQuery = appointmentQuery.where(like(appointments.service, `%${service}%`));
    }

    // Apply date range filter based on view
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (dateRange?.start && dateRange?.end) {
      startDate = new Date(dateRange.start);
      endDate = new Date(dateRange.end);
    } else {
      // Set default date ranges based on view
      switch (view) {
        case "day":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
          break;
        case "week":
          const weekStart = now.getDate() - now.getDay();
          startDate = new Date(now.getFullYear(), now.getMonth(), weekStart);
          endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          break;
        default:
          // For "list" view, show upcoming appointments
          startDate = new Date();
          endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Next 30 days
      }
    }

    appointmentQuery = appointmentQuery.where(
      and(
        gte(appointments.dateTime, startDate),
        lte(appointments.dateTime, endDate)
      )
    );

    // Get paginated results
    const allAppointments = await appointmentQuery
      .orderBy(appointments.dateTime)
      .limit(limit)
      .offset(offset);

    // Get total count for pagination (with same filters)
    let countQuery = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(appointments)
      .leftJoin(clients, eq(appointments.clientId, clients.id))
      .leftJoin(users, eq(appointments.providerId, users.id))
      .where(eq(appointments.orgId, session.user.orgId));

    // Apply same filters to count query
    if (search) {
      countQuery = countQuery.where(
        or(
          like(clients.fullName, `%${search}%`),
          like(clients.email, `%${search}%`),
          like(appointments.service, `%${search}%`),
          like(users.name, `%${search}%`)
        )
      );
    }

    if (status !== "all") {
      countQuery = countQuery.where(eq(appointments.status, status as any));
    }

    if (providerId) {
      countQuery = countQuery.where(eq(appointments.providerId, providerId));
    }

    if (clientId) {
      countQuery = countQuery.where(eq(appointments.clientId, clientId));
    }

    if (service) {
      countQuery = countQuery.where(like(appointments.service, `%${service}%`));
    }

    countQuery = countQuery.where(
      and(
        gte(appointments.dateTime, startDate),
        lte(appointments.dateTime, endDate)
      )
    );

    const [{ count: totalAppointments }] = await countQuery;

    // Calculate analytics
    const analytics = {
      totalAppointments,
      scheduledAppointments: allAppointments.filter(a => a.status === "scheduled").length,
      confirmedAppointments: allAppointments.filter(a => a.status === "confirmed").length,
      completedAppointments: allAppointments.filter(a => a.status === "completed").length,
      cancelledAppointments: allAppointments.filter(a => a.status === "cancelled").length,
      totalRevenue: allAppointments
        .filter(a => a.status === "completed")
        .reduce((sum, a) => sum + (a.price || 0), 0),
      averageDuration: allAppointments.length > 0 ? 
        Math.round(allAppointments.reduce((sum, a) => sum + a.duration, 0) / allAppointments.length) : 0,
      // Group by provider
      providerStats: getProviderStats(allAppointments),
      // Group by service
      serviceStats: getServiceStats(allAppointments),
      // Today's appointments
      todayAppointments: allAppointments.filter(a => {
        const appointmentDate = new Date(a.dateTime);
        const today = new Date();
        return appointmentDate.toDateString() === today.toDateString();
      }).length,
    };

    const totalPages = Math.ceil(totalAppointments / limit);

    return NextResponse.json({
      appointments: allAppointments,
      pagination: {
        page,
        limit,
        totalAppointments,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      analytics,
      viewParams: {
        view,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

// POST /api/appointments - Create a new appointment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createAppointmentSchema.parse(body);

    // Verify client exists and belongs to this org
    const client = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.id, validatedData.clientId),
          eq(clients.orgId, session.user.orgId)
        )
      )
      .limit(1);

    if (client.length === 0) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Verify provider exists and belongs to this org
    const provider = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, validatedData.providerId),
          eq(users.orgId, session.user.orgId),
          eq(users.isActive, true)
        )
      )
      .limit(1);

    if (provider.length === 0) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    // Check for scheduling conflicts
    const appointmentStart = new Date(validatedData.dateTime);
    const appointmentEnd = new Date(appointmentStart.getTime() + validatedData.duration * 60 * 1000);

    const conflictingAppointments = await db
      .select({
        id: appointments.id,
        service: appointments.service,
        dateTime: appointments.dateTime,
        duration: appointments.duration,
        clientName: clients.fullName,
      })
      .from(appointments)
      .leftJoin(clients, eq(appointments.clientId, clients.id))
      .where(
        and(
          eq(appointments.orgId, session.user.orgId),
          eq(appointments.providerId, validatedData.providerId),
          or(
            eq(appointments.status, 'scheduled'),
            eq(appointments.status, 'confirmed')
          ),
          // Check for time overlap using dateTime and duration
          sql`(
            (${appointments.dateTime} < ${appointmentEnd.toISOString()} AND 
             DATE_ADD(${appointments.dateTime}, INTERVAL ${appointments.duration} MINUTE) > ${appointmentStart.toISOString()})
          )`
        )
      );

    if (conflictingAppointments.length > 0) {
      return NextResponse.json(
        { 
          error: "Scheduling conflict detected",
          conflictingAppointments: conflictingAppointments.map(apt => ({
            id: apt.id,
            service: apt.service,
            dateTime: apt.dateTime,
            duration: apt.duration,
            clientName: apt.clientName,
          }))
        },
        { status: 409 }
      );
    }

    // Create new appointment
    const newAppointment = await db.insert(appointments).values({
      orgId: session.user.orgId,
      clientId: validatedData.clientId,
      providerId: validatedData.providerId,
      service: validatedData.service,
      dateTime: new Date(validatedData.dateTime),
      duration: validatedData.duration,
      status: validatedData.status,
      price: validatedData.price,
      notes: validatedData.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Get the created appointment with full details
    const createdAppointment = await db
      .select({
        id: appointments.id,
        service: appointments.service,
        dateTime: appointments.dateTime,
        duration: appointments.duration,
        status: appointments.status,
        price: appointments.price,
        clientName: clients.fullName,
        providerName: users.name,
      })
      .from(appointments)
      .leftJoin(clients, eq(appointments.clientId, clients.id))
      .leftJoin(users, eq(appointments.providerId, users.id))
      .where(eq(appointments.id, newAppointment.insertId as number))
      .limit(1);

    return NextResponse.json({
      message: "Appointment created successfully",
      appointment: createdAppointment[0],
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}

// Helper function to get provider statistics
function getProviderStats(appointments: any[]) {
  const providers = appointments.reduce((acc, appointment) => {
    const providerName = appointment.providerName || "Unknown Provider";
    if (!acc[providerName]) {
      acc[providerName] = {
        name: providerName,
        appointments: 0,
        revenue: 0,
        completedAppointments: 0,
      };
    }
    acc[providerName].appointments++;
    if (appointment.status === "completed") {
      acc[providerName].completedAppointments++;
      acc[providerName].revenue += appointment.price || 0;
    }
    return acc;
  }, {} as Record<string, any>);

  return Object.values(providers).sort((a: any, b: any) => b.appointments - a.appointments);
}

// Helper function to get service statistics
function getServiceStats(appointments: any[]) {
  const services = appointments.reduce((acc, appointment) => {
    const service = appointment.service || "Unknown Service";
    if (!acc[service]) {
      acc[service] = {
        service,
        appointments: 0,
        revenue: 0,
        averageDuration: 0,
        totalDuration: 0,
      };
    }
    acc[service].appointments++;
    acc[service].totalDuration += appointment.duration || 0;
    if (appointment.status === "completed") {
      acc[service].revenue += appointment.price || 0;
    }
    return acc;
  }, {} as Record<string, any>);

  // Calculate average duration for each service
  Object.values(services).forEach((service: any) => {
    if (service.appointments > 0) {
      service.averageDuration = Math.round(service.totalDuration / service.appointments);
    }
  });

  return Object.values(services)
    .sort((a: any, b: any) => b.appointments - a.appointments)
    .map(({ totalDuration, ...service }) => service); // Remove totalDuration from response
}