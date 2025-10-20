import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orgs, users } from "@/db/schema";
import { eq, desc, sql, and, like } from "drizzle-orm";
import { z } from "zod";

// Schema for creating a new organization
const createOrgSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  address: z.string().optional(),
  subscriptionTier: z.enum(["basic", "pro", "enterprise"]).default("basic"),
  adminUserName: z.string().min(1, "Admin user name is required"),
  adminUserEmail: z.string().email("Valid admin email is required"),
});

// GET /api/master-admin/organizations - Get all organizations with stats
export async function GET(request: NextRequest) {
  try {
    // TODO: Add master admin authentication check
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.isMasterOwner) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    // Get organizations with user counts and revenue stats
    let orgQuery = db
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
        createdAt: orgs.createdAt,
        updatedAt: orgs.updatedAt,
        // Count users for each organization
        userCount: sql<number>`(
          SELECT COUNT(*) 
          FROM ${users} 
          WHERE ${users.orgId} = ${orgs.id}
        )`.as('userCount'),
        // Get last user activity
        lastActivity: sql<string>`(
          SELECT MAX(${users.lastLoginAt}) 
          FROM ${users} 
          WHERE ${users.orgId} = ${orgs.id}
        )`.as('lastActivity'),
      })
      .from(orgs);

    // Apply search filter
    if (search) {
      orgQuery = orgQuery.where(
        sql`${orgs.name} LIKE ${`%${search}%`} OR ${orgs.email} LIKE ${`%${search}%`}`
      );
    }

    // Apply status filter
    if (status !== 'all') {
      orgQuery = orgQuery.where(eq(orgs.status, status as any));
    }

    const organizations = await orgQuery.orderBy(desc(orgs.createdAt));

    // Calculate summary statistics
    const totalRevenue = organizations.reduce((sum, org) => sum + (org.monthlyRevenue || 0), 0);
    const totalUsers = organizations.reduce((sum, org) => sum + (org.userCount || 0), 0);
    const activeOrgs = organizations.filter(org => org.status === 'active').length;

    return NextResponse.json({
      organizations: organizations.map(org => ({
        ...org,
        lastActive: org.lastActivity || org.updatedAt,
      })),
      summary: {
        total: organizations.length,
        active: activeOrgs,
        suspended: organizations.filter(org => org.status === 'suspended').length,
        pending: organizations.filter(org => org.status === 'pending').length,
        totalUsers,
        totalRevenue,
      },
    });

  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}

// POST /api/master-admin/organizations - Create new organization
export async function POST(request: NextRequest) {
  try {
    // TODO: Add master admin authentication check
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.isMasterOwner) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const body = await request.json();
    const validatedData = createOrgSchema.parse(body);

    // Check if organization email already exists
    const existingOrg = await db
      .select({ id: orgs.id })
      .from(orgs)
      .where(eq(orgs.email, validatedData.email))
      .limit(1);

    if (existingOrg.length > 0) {
      return NextResponse.json(
        { error: "Organization with this email already exists" },
        { status: 400 }
      );
    }

    // Check if admin user email already exists
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, validatedData.adminUserEmail))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "User with admin email already exists" },
        { status: 400 }
      );
    }

    // Create organization
    const newOrg = await db.insert(orgs).values({
      name: validatedData.name,
      email: validatedData.email,
      phone: validatedData.phone,
      website: validatedData.website,
      address: validatedData.address,
      status: "pending", // New orgs start as pending
      subscriptionTier: validatedData.subscriptionTier,
      monthlyRevenue: 0,
      maxUsers: validatedData.subscriptionTier === "basic" ? 5 : 
                validatedData.subscriptionTier === "pro" ? 25 : 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const orgId = newOrg.insertId;

    // Create admin user for the organization
    await db.insert(users).values({
      orgId: Number(orgId),
      email: validatedData.adminUserEmail,
      name: validatedData.adminUserName,
      role: "owner", // Organization creator is owner
      password: "password123", // Temporary password - user will be prompted to change
      isActive: true,
      isMasterOwner: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      message: "Organization created successfully",
      organizationId: orgId,
      organization: {
        id: orgId,
        name: validatedData.name,
        email: validatedData.email,
        status: "pending",
        adminUser: {
          email: validatedData.adminUserEmail,
          name: validatedData.adminUserName,
          temporaryPassword: "password123",
        },
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating organization:", error);
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
}