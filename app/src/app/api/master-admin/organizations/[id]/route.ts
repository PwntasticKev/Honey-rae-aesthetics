import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orgs, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

// Schema for updating organization
const updateOrgSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  address: z.string().optional(),
  status: z.enum(["active", "suspended", "pending"]).optional(),
  subscriptionTier: z.enum(["basic", "pro", "enterprise"]).optional(),
  monthlyRevenue: z.number().min(0).optional(),
});

// GET /api/master-admin/organizations/[id] - Get organization details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orgId = parseInt(params.id);
    
    if (isNaN(orgId)) {
      return NextResponse.json(
        { error: "Invalid organization ID" },
        { status: 400 }
      );
    }

    // Get organization with detailed stats
    const organization = await db
      .select({
        id: orgs.id,
        name: orgs.name,
        email: orgs.email,
        phone: orgs.phone,
        website: orgs.website,
        address: orgs.address,
        status: orgs.status,
        subscriptionTier: orgs.subscriptionTier,
        monthlyRevenue: orgs.monthlyRevenue,
        maxUsers: orgs.maxUsers,
        createdAt: orgs.createdAt,
        updatedAt: orgs.updatedAt,
        // Count users by role
        totalUsers: sql<number>`(
          SELECT COUNT(*) 
          FROM ${users} 
          WHERE ${users.orgId} = ${orgs.id}
        )`.as('totalUsers'),
        activeUsers: sql<number>`(
          SELECT COUNT(*) 
          FROM ${users} 
          WHERE ${users.orgId} = ${orgs.id} AND ${users.isActive} = true
        )`.as('activeUsers'),
        adminUsers: sql<number>`(
          SELECT COUNT(*) 
          FROM ${users} 
          WHERE ${users.orgId} = ${orgs.id} AND ${users.role} IN ('owner', 'admin')
        )`.as('adminUsers'),
      })
      .from(orgs)
      .where(eq(orgs.id, orgId))
      .limit(1);

    if (!organization.length) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Get organization users
    const orgUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        isMasterOwner: users.isMasterOwner,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.orgId, orgId));

    return NextResponse.json({
      organization: {
        ...organization[0],
        users: orgUsers,
      },
    });

  } catch (error) {
    console.error("Error fetching organization:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization" },
      { status: 500 }
    );
  }
}

// PATCH /api/master-admin/organizations/[id] - Update organization
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orgId = parseInt(params.id);
    
    if (isNaN(orgId)) {
      return NextResponse.json(
        { error: "Invalid organization ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateOrgSchema.parse(body);

    // Check if organization exists
    const existingOrg = await db
      .select({ id: orgs.id })
      .from(orgs)
      .where(eq(orgs.id, orgId))
      .limit(1);

    if (!existingOrg.length) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Check if email is being changed and if it already exists
    if (validatedData.email) {
      const emailExists = await db
        .select({ id: orgs.id })
        .from(orgs)
        .where(sql`${orgs.email} = ${validatedData.email} AND ${orgs.id} != ${orgId}`)
        .limit(1);

      if (emailExists.length > 0) {
        return NextResponse.json(
          { error: "Organization with this email already exists" },
          { status: 400 }
        );
      }
    }

    // Update max users based on subscription tier
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    };

    if (validatedData.subscriptionTier) {
      updateData.maxUsers = validatedData.subscriptionTier === "basic" ? 5 : 
                           validatedData.subscriptionTier === "pro" ? 25 : 100;
    }

    // Update organization
    await db
      .update(orgs)
      .set(updateData)
      .where(eq(orgs.id, orgId));

    // Get updated organization
    const updatedOrg = await db
      .select()
      .from(orgs)
      .where(eq(orgs.id, orgId))
      .limit(1);

    return NextResponse.json({
      message: "Organization updated successfully",
      organization: updatedOrg[0],
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating organization:", error);
    return NextResponse.json(
      { error: "Failed to update organization" },
      { status: 500 }
    );
  }
}

// DELETE /api/master-admin/organizations/[id] - Delete organization (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orgId = parseInt(params.id);
    
    if (isNaN(orgId)) {
      return NextResponse.json(
        { error: "Invalid organization ID" },
        { status: 400 }
      );
    }

    // Check if organization exists
    const existingOrg = await db
      .select({ id: orgs.id, name: orgs.name })
      .from(orgs)
      .where(eq(orgs.id, orgId))
      .limit(1);

    if (!existingOrg.length) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Check if organization has users
    const userCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(eq(users.orgId, orgId));

    if (userCount[0].count > 0) {
      // Soft delete - suspend organization instead of deleting
      await db
        .update(orgs)
        .set({
          status: "suspended",
          updatedAt: new Date(),
        })
        .where(eq(orgs.id, orgId));

      // Deactivate all users
      await db
        .update(users)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(users.orgId, orgId));

      return NextResponse.json({
        message: "Organization suspended and all users deactivated",
        action: "suspended",
      });
    } else {
      // Hard delete if no users
      await db
        .delete(orgs)
        .where(eq(orgs.id, orgId));

      return NextResponse.json({
        message: "Organization deleted successfully",
        action: "deleted",
      });
    }

  } catch (error) {
    console.error("Error deleting organization:", error);
    return NextResponse.json(
      { error: "Failed to delete organization" },
      { status: 500 }
    );
  }
}