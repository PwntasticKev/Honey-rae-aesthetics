import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orgs, users } from "@/db/schema";
import { eq, desc, sql, like, and, or } from "drizzle-orm";
import { z } from "zod";

// Schema for user search and filtering
const userSearchSchema = z.object({
  search: z.string().optional(),
  role: z.enum(["all", "owner", "admin", "manager", "staff"]).optional(),
  status: z.enum(["all", "active", "inactive"]).optional(),
  orgId: z.coerce.number().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
});

// GET /api/master-admin/users - Get all users across organizations
export async function GET(request: NextRequest) {
  try {
    // TODO: Add master admin authentication check
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.isMasterOwner) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const {
      search = "",
      role = "all",
      status = "all", 
      orgId,
      page = 1,
      limit = 20
    } = userSearchSchema.parse(Object.fromEntries(searchParams));

    const offset = (page - 1) * limit;

    // Build dynamic query for users with organization info
    let userQuery = db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        isMasterOwner: users.isMasterOwner,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        orgId: users.orgId,
        orgName: orgs.name,
        orgEmail: orgs.email,
        orgStatus: orgs.status,
        orgSubscriptionTier: orgs.subscriptionTier,
      })
      .from(users)
      .leftJoin(orgs, eq(users.orgId, orgs.id));

    // Apply search filter
    if (search) {
      userQuery = userQuery.where(
        or(
          like(users.name, `%${search}%`),
          like(users.email, `%${search}%`),
          like(orgs.name, `%${search}%`)
        )
      );
    }

    // Apply role filter
    if (role !== "all") {
      userQuery = userQuery.where(eq(users.role, role as any));
    }

    // Apply status filter
    if (status !== "all") {
      const isActiveFilter = status === "active";
      userQuery = userQuery.where(eq(users.isActive, isActiveFilter));
    }

    // Apply organization filter
    if (orgId) {
      userQuery = userQuery.where(eq(users.orgId, orgId));
    }

    // Get paginated results
    const allUsers = await userQuery
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    let countQuery = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .leftJoin(orgs, eq(users.orgId, orgs.id));

    if (search) {
      countQuery = countQuery.where(
        or(
          like(users.name, `%${search}%`),
          like(users.email, `%${search}%`),
          like(orgs.name, `%${search}%`)
        )
      );
    }

    if (role !== "all") {
      countQuery = countQuery.where(eq(users.role, role as any));
    }

    if (status !== "all") {
      const isActiveFilter = status === "active";
      countQuery = countQuery.where(eq(users.isActive, isActiveFilter));
    }

    if (orgId) {
      countQuery = countQuery.where(eq(users.orgId, orgId));
    }

    const [{ count: totalUsers }] = await countQuery;

    // Calculate summary statistics
    const activeUsers = allUsers.filter(user => user.isActive).length;
    const masterOwners = allUsers.filter(user => user.isMasterOwner).length;
    const admins = allUsers.filter(user => user.role === "admin" || user.role === "owner").length;

    // Group users by organization
    const usersByOrg = allUsers.reduce((acc, user) => {
      const orgName = user.orgName || "Unknown Organization";
      if (!acc[orgName]) {
        acc[orgName] = [];
      }
      acc[orgName].push(user);
      return acc;
    }, {} as Record<string, typeof allUsers>);

    const totalPages = Math.ceil(totalUsers / limit);

    return NextResponse.json({
      users: allUsers,
      usersByOrg,
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      summary: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        masterOwners,
        admins,
        organizations: Object.keys(usersByOrg).length,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// Schema for bulk user actions
const bulkActionSchema = z.object({
  action: z.enum(["activate", "deactivate", "delete"]),
  userIds: z.array(z.number()).min(1, "At least one user ID is required"),
});

// POST /api/master-admin/users - Bulk user actions
export async function POST(request: NextRequest) {
  try {
    // TODO: Add master admin authentication check
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.isMasterOwner) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const body = await request.json();
    const { action, userIds } = bulkActionSchema.parse(body);

    // Prevent actions on master owners
    const masterOwners = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(
        and(
          sql`${users.id} IN (${userIds.join(",")})`,
          eq(users.isMasterOwner, true)
        )
      );

    if (masterOwners.length > 0) {
      return NextResponse.json(
        { 
          error: "Cannot perform bulk actions on master owners",
          affectedUsers: masterOwners 
        },
        { status: 400 }
      );
    }

    let result;
    const timestamp = new Date();

    switch (action) {
      case "activate":
        result = await db
          .update(users)
          .set({ isActive: true, updatedAt: timestamp })
          .where(sql`${users.id} IN (${userIds.join(",")})`);
        break;

      case "deactivate":
        result = await db
          .update(users)
          .set({ isActive: false, updatedAt: timestamp })
          .where(sql`${users.id} IN (${userIds.join(",")})`);
        break;

      case "delete":
        // Soft delete - mark as inactive and anonymize
        result = await db
          .update(users)
          .set({
            isActive: false,
            email: sql`CONCAT('deleted_', ${users.id}, '@deleted.local')`,
            name: sql`CONCAT('Deleted User ', ${users.id})`,
            updatedAt: timestamp,
          })
          .where(sql`${users.id} IN (${userIds.join(",")})`);
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: `Successfully ${action === "activate" ? "activated" : action === "deactivate" ? "deactivated" : "deleted"} ${userIds.length} users`,
      affectedUsers: userIds.length,
      action,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error performing bulk user action:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk action" },
      { status: 500 }
    );
  }
}