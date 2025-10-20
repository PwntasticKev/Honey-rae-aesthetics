import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, orgs } from "@/db/schema";
import { ilike, or, and, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "10");
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        results: [],
        total: 0
      });
    }

    // Get user info from headers (set by middleware)
    const userId = request.headers.get("x-user-id");
    const userOrgId = request.headers.get("x-user-org");
    
    if (!userId || !userOrgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchTerm = `%${query.trim()}%`;
    const orgId = parseInt(userOrgId);

    // Search users within the same organization
    const userResults = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        type: "user" as const,
      })
      .from(users)
      .where(
        and(
          eq(users.orgId, orgId),
          or(
            ilike(users.name, searchTerm),
            ilike(users.email, searchTerm)
          )
        )
      )
      .limit(limit);

    // Search organization info (for master owners)
    const orgResults = await db
      .select({
        id: orgs.id,
        name: orgs.name,
        slug: orgs.slug,
        type: "organization" as const,
      })
      .from(orgs)
      .where(
        and(
          eq(orgs.id, orgId),
          ilike(orgs.name, searchTerm)
        )
      )
      .limit(limit);

    // Combine results
    const allResults = [
      ...userResults.map(user => ({
        id: user.id.toString(),
        title: user.name || user.email,
        subtitle: `${user.role} • ${user.email}`,
        type: user.type,
        url: `/users/${user.id}`,
      })),
      ...orgResults.map(org => ({
        id: org.id.toString(),
        title: org.name,
        subtitle: `Organization • ${org.slug}`,
        type: org.type,
        url: `/settings/organization`,
      })),
    ];

    return NextResponse.json({
      results: allResults,
      total: allResults.length,
      query: query
    });

  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}