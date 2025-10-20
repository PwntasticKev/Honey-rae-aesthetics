import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orgs, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

// Schema for updating user
const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(["owner", "admin", "manager", "staff"]).optional(),
  isActive: z.boolean().optional(),
  orgId: z.number().optional(),
});

// GET /api/master-admin/users/[id] - Get user details with organization info
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    // Get user with organization details
    const userDetails = await db
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
        orgMaxUsers: orgs.maxUsers,
        orgCreatedAt: orgs.createdAt,
      })
      .from(users)
      .leftJoin(orgs, eq(users.orgId, orgs.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (!userDetails.length) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const user = userDetails[0];

    // Get user activity stats if organization exists
    let organizationStats = null;
    if (user.orgId) {
      const orgStats = await db
        .select({
          totalUsers: sql<number>`COUNT(*)`,
          activeUsers: sql<number>`SUM(CASE WHEN ${users.isActive} THEN 1 ELSE 0 END)`,
          adminUsers: sql<number>`SUM(CASE WHEN ${users.role} IN ('owner', 'admin') THEN 1 ELSE 0 END)`,
        })
        .from(users)
        .where(eq(users.orgId, user.orgId));

      organizationStats = orgStats[0];
    }

    return NextResponse.json({
      user: {
        ...user,
        organization: user.orgId ? {
          id: user.orgId,
          name: user.orgName,
          email: user.orgEmail,
          status: user.orgStatus,
          subscriptionTier: user.orgSubscriptionTier,
          maxUsers: user.orgMaxUsers,
          createdAt: user.orgCreatedAt,
          stats: organizationStats,
        } : null,
      },
    });

  } catch (error) {
    console.error("Error fetching user details:", error);
    return NextResponse.json(
      { error: "Failed to fetch user details" },
      { status: 500 }
    );
  }
}

// PATCH /api/master-admin/users/[id] - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // Check if user exists
    const existingUser = await db
      .select({ 
        id: users.id, 
        isMasterOwner: users.isMasterOwner,
        orgId: users.orgId,
        email: users.email 
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existingUser.length) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const user = existingUser[0];

    // Prevent modifying master owners
    if (user.isMasterOwner && (validatedData.role || validatedData.isActive === false)) {
      return NextResponse.json(
        { error: "Cannot modify role or deactivate master owners" },
        { status: 400 }
      );
    }

    // Check if email is being changed and if it already exists
    if (validatedData.email && validatedData.email !== user.email) {
      const emailExists = await db
        .select({ id: users.id })
        .from(users)
        .where(sql`${users.email} = ${validatedData.email} AND ${users.id} != ${userId}`)
        .limit(1);

      if (emailExists.length > 0) {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 400 }
        );
      }
    }

    // Check if moving to different organization
    if (validatedData.orgId && validatedData.orgId !== user.orgId) {
      // Verify target organization exists
      const targetOrg = await db
        .select({ id: orgs.id, maxUsers: orgs.maxUsers })
        .from(orgs)
        .where(eq(orgs.id, validatedData.orgId))
        .limit(1);

      if (!targetOrg.length) {
        return NextResponse.json(
          { error: "Target organization not found" },
          { status: 400 }
        );
      }

      // Check if target organization has space
      const targetOrgUserCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(users)
        .where(eq(users.orgId, validatedData.orgId));

      if (targetOrgUserCount[0].count >= targetOrg[0].maxUsers) {
        return NextResponse.json(
          { error: "Target organization has reached user limit" },
          { status: 400 }
        );
      }
    }

    // Update user
    const updateData = {
      ...validatedData,
      updatedAt: new Date(),
    };

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId));

    // Get updated user details
    const updatedUser = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        isMasterOwner: users.isMasterOwner,
        orgId: users.orgId,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser[0],
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/master-admin/users/[id] - Delete user (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db
      .select({ 
        id: users.id, 
        name: users.name,
        email: users.email,
        isMasterOwner: users.isMasterOwner,
        orgId: users.orgId 
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existingUser.length) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const user = existingUser[0];

    // Prevent deleting master owners
    if (user.isMasterOwner) {
      return NextResponse.json(
        { error: "Cannot delete master owners" },
        { status: 400 }
      );
    }

    // Check if user is the only owner of their organization
    if (user.orgId) {
      const orgOwners = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(users)
        .where(
          sql`${users.orgId} = ${user.orgId} AND ${users.role} = 'owner' AND ${users.isActive} = true`
        );

      if (orgOwners[0].count <= 1) {
        return NextResponse.json(
          { error: "Cannot delete the last active owner of an organization" },
          { status: 400 }
        );
      }
    }

    // Soft delete - anonymize user data
    await db
      .update(users)
      .set({
        isActive: false,
        email: `deleted_${userId}@deleted.local`,
        name: `Deleted User ${userId}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({
      message: "User deleted successfully",
      action: "soft_delete",
      userId,
    });

  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}