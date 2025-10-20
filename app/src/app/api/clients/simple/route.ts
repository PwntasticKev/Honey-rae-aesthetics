import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients } from "@/db/schema";
import { eq, desc, like, or } from "drizzle-orm";

// GET /api/clients/simple - Get all clients (no auth for testing)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const orgId = parseInt(searchParams.get('orgId') || '1'); // Default to org 1 for testing

    // Build query with search functionality
    let query = db.select().from(clients).where(eq(clients.orgId, orgId));

    if (search) {
      query = query.where(
        or(
          like(clients.fullName, `%${search}%`),
          like(clients.email, `%${search}%`)
        )
      );
    }

    const clientList = await query
      .orderBy(desc(clients.createdAt))
      .limit(Math.min(limit, 100))
      .offset(offset);

    // Get total count for pagination
    const totalCount = await db
      .select()
      .from(clients)
      .where(eq(clients.orgId, orgId));

    return NextResponse.json({
      clients: clientList,
      total: totalCount.length,
      limit,
      offset,
      message: "Clients retrieved successfully (no auth)",
    });

  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients", details: String(error) },
      { status: 500 }
    );
  }
}