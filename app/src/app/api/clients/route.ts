import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { clients, appointments, files, workflowEnrollments, users } from "@/db/schema";
import { eq, and, desc, like, or, sql, gte, lte } from "drizzle-orm";
import { z } from "zod";

// Enhanced schema for creating a new client
const createClientSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phones: z.array(z.string()).optional().default([]),
  gender: z.string().min(1, "Gender is required"),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  referralSource: z.string().min(1, "Referral source is required"),
  tags: z.array(z.string()).optional().default([]),
  clientPortalStatus: z.enum(["invited", "active", "inactive"]).default("inactive"),
  notes: z.string().optional(),
});

// Schema for client filtering and search
const clientFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["all", "active", "inactive"]).optional(),
  gender: z.enum(["all", "male", "female", "non-binary", "other"]).optional(),
  tags: z.string().optional(), // comma-separated tags
  referralSource: z.string().optional(),
  dateRange: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
  sortBy: z.enum(["name", "created", "lastAppointment", "totalSpent"]).default("created"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Schema for updating a client
const updateClientSchema = createClientSchema.partial();

// GET /api/clients - Get all clients with advanced filtering and analytics
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
      gender = "all", 
      tags = "",
      referralSource = "",
      dateRange,
      page = 1,
      limit = 20,
      sortBy = "created",
      sortOrder = "desc"
    } = clientFilterSchema.parse(Object.fromEntries(searchParams));

    const offset = (page - 1) * limit;

    // Build dynamic query for clients with additional stats
    let clientQuery = db
      .select({
        id: clients.id,
        fullName: clients.fullName,
        email: clients.email,
        phones: clients.phones,
        gender: clients.gender,
        dateOfBirth: clients.dateOfBirth,
        address: clients.address,
        referralSource: clients.referralSource,
        tags: clients.tags,
        clientPortalStatus: clients.clientPortalStatus,
        notes: clients.notes,
        createdAt: clients.createdAt,
        updatedAt: clients.updatedAt,
        // Calculate appointment stats
        totalAppointments: sql<number>`(
          SELECT COUNT(*) 
          FROM ${appointments} 
          WHERE ${appointments.clientId} = ${clients.id}
        )`.as('totalAppointments'),
        upcomingAppointments: sql<number>`(
          SELECT COUNT(*) 
          FROM ${appointments} 
          WHERE ${appointments.clientId} = ${clients.id} 
          AND ${appointments.dateTime} > NOW()
          AND ${appointments.status} IN ('scheduled', 'confirmed')
        )`.as('upcomingAppointments'),
        lastAppointment: sql<string>`(
          SELECT MAX(${appointments.dateTime}) 
          FROM ${appointments} 
          WHERE ${appointments.clientId} = ${clients.id}
        )`.as('lastAppointment'),
        totalSpent: sql<number>`(
          SELECT COALESCE(SUM(${appointments.price}), 0) 
          FROM ${appointments} 
          WHERE ${appointments.clientId} = ${clients.id}
          AND ${appointments.status} = 'completed'
        )`.as('totalSpent'),
        // File count
        photoCount: sql<number>`(
          SELECT COUNT(*) 
          FROM ${files} 
          WHERE ${files.clientId} = ${clients.id}
          AND ${files.type} = 'photo'
        )`.as('photoCount'),
        // Active workflow count
        activeWorkflows: sql<number>`(
          SELECT COUNT(*) 
          FROM ${workflowEnrollments} 
          WHERE ${workflowEnrollments.clientId} = ${clients.id}
          AND ${workflowEnrollments.currentStatus} = 'active'
        )`.as('activeWorkflows'),
      })
      .from(clients)
      .where(eq(clients.orgId, session.user.orgId));

    // Apply search filter
    if (search) {
      clientQuery = clientQuery.where(
        or(
          like(clients.fullName, `%${search}%`),
          like(clients.email, `%${search}%`),
          sql`JSON_SEARCH(${clients.phones}, 'one', ${`%${search}%`}) IS NOT NULL`
        )
      );
    }

    // Apply status filter (based on portal status)
    if (status !== "all") {
      if (status === "active") {
        clientQuery = clientQuery.where(eq(clients.clientPortalStatus, "active"));
      } else if (status === "inactive") {
        clientQuery = clientQuery.where(eq(clients.clientPortalStatus, "inactive"));
      }
    }

    // Apply gender filter
    if (gender !== "all") {
      clientQuery = clientQuery.where(eq(clients.gender, gender));
    }

    // Apply tags filter
    if (tags) {
      const tagList = tags.split(",").map(tag => tag.trim());
      for (const tag of tagList) {
        clientQuery = clientQuery.where(
          sql`JSON_SEARCH(${clients.tags}, 'one', ${tag}) IS NOT NULL`
        );
      }
    }

    // Apply referral source filter
    if (referralSource) {
      clientQuery = clientQuery.where(eq(clients.referralSource, referralSource));
    }

    // Apply date range filter
    if (dateRange?.start) {
      clientQuery = clientQuery.where(gte(clients.createdAt, new Date(dateRange.start)));
    }
    if (dateRange?.end) {
      clientQuery = clientQuery.where(lte(clients.createdAt, new Date(dateRange.end)));
    }

    // Apply sorting
    let orderBy;
    switch (sortBy) {
      case "name":
        orderBy = sortOrder === "desc" ? desc(clients.fullName) : clients.fullName;
        break;
      case "lastAppointment":
        orderBy = sql`lastAppointment ${sortOrder === "desc" ? sql`DESC` : sql`ASC`} NULLS LAST`;
        break;
      case "totalSpent":
        orderBy = sql`totalSpent ${sortOrder === "desc" ? sql`DESC` : sql`ASC`}`;
        break;
      default:
        orderBy = sortOrder === "desc" ? desc(clients.createdAt) : clients.createdAt;
    }

    // Get paginated results
    const allClients = await clientQuery
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Get total count for pagination (with same filters applied)
    let countQuery = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(clients)
      .where(eq(clients.orgId, session.user.orgId));

    // Apply same filters to count query
    if (search) {
      countQuery = countQuery.where(
        or(
          like(clients.fullName, `%${search}%`),
          like(clients.email, `%${search}%`),
          sql`JSON_SEARCH(${clients.phones}, 'one', ${`%${search}%`}) IS NOT NULL`
        )
      );
    }

    if (status !== "all") {
      if (status === "active") {
        countQuery = countQuery.where(eq(clients.clientPortalStatus, "active"));
      } else if (status === "inactive") {
        countQuery = countQuery.where(eq(clients.clientPortalStatus, "inactive"));
      }
    }

    if (gender !== "all") {
      countQuery = countQuery.where(eq(clients.gender, gender));
    }

    if (tags) {
      const tagList = tags.split(",").map(tag => tag.trim());
      for (const tag of tagList) {
        countQuery = countQuery.where(
          sql`JSON_SEARCH(${clients.tags}, 'one', ${tag}) IS NOT NULL`
        );
      }
    }

    if (referralSource) {
      countQuery = countQuery.where(eq(clients.referralSource, referralSource));
    }

    if (dateRange?.start) {
      countQuery = countQuery.where(gte(clients.createdAt, new Date(dateRange.start)));
    }
    if (dateRange?.end) {
      countQuery = countQuery.where(lte(clients.createdAt, new Date(dateRange.end)));
    }

    const [{ count: totalClients }] = await countQuery;

    // Calculate analytics
    const analytics = {
      totalClients,
      activeClients: allClients.filter(c => c.clientPortalStatus === "active").length,
      inactiveClients: allClients.filter(c => c.clientPortalStatus === "inactive").length,
      totalRevenue: allClients.reduce((sum, c) => sum + (c.totalSpent || 0), 0),
      averageSpent: totalClients > 0 ? 
        allClients.reduce((sum, c) => sum + (c.totalSpent || 0), 0) / totalClients : 0,
      totalAppointments: allClients.reduce((sum, c) => sum + (c.totalAppointments || 0), 0),
      upcomingAppointments: allClients.reduce((sum, c) => sum + (c.upcomingAppointments || 0), 0),
      // Top referral sources
      topReferralSources: getTopReferralSources(allClients),
      // Recent clients (last 30 days)
      recentClients: allClients.filter(c => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return new Date(c.createdAt) > thirtyDaysAgo;
      }).length,
    };

    const totalPages = Math.ceil(totalClients / limit);

    return NextResponse.json({
      clients: allClients,
      pagination: {
        page,
        limit,
        totalClients,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      analytics,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

// POST /api/clients - Create a new client
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
    const validatedData = createClientSchema.parse(body);

    // Check for potential duplicates before creating
    const duplicateCheck = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.orgId, session.user.orgId),
          eq(clients.email, validatedData.email)
        )
      )
      .limit(1);

    if (duplicateCheck.length > 0) {
      return NextResponse.json(
        { 
          error: "Client with this email already exists",
          existingClient: duplicateCheck[0],
          suggestion: "Consider using the duplicate detection system"
        },
        { status: 409 }
      );
    }

    // Create new client
    const newClient = await db.insert(clients).values({
      orgId: session.user.orgId,
      fullName: validatedData.fullName,
      email: validatedData.email,
      phones: validatedData.phones || [],
      gender: validatedData.gender,
      dateOfBirth: validatedData.dateOfBirth,
      address: validatedData.address,
      referralSource: validatedData.referralSource,
      tags: validatedData.tags || [],
      clientPortalStatus: validatedData.clientPortalStatus || "inactive",
      notes: validatedData.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Get the created client with full details
    const createdClient = await db
      .select()
      .from(clients)
      .where(eq(clients.id, newClient.insertId as number))
      .limit(1);

    return NextResponse.json({
      message: "Client created successfully",
      client: createdClient[0],
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}

// Helper function to get top referral sources
function getTopReferralSources(clients: any[]) {
  const sources = clients.reduce((acc, client) => {
    const source = client.referralSource || "Unknown";
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(sources)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([source, count]) => ({ source, count }));
}