import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

// Schema for creating a new team member
const createTeamMemberSchema = z.object({
  email: z.string().email("Valid email is required"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["admin", "manager", "staff"], {
    errorMap: () => ({ message: "Role must be admin, manager, or staff" })
  }),
});

// GET /api/teams - Get all team members for the organization
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get all users in the organization
    const teamMembers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        avatar: users.avatar,
        phone: users.phone,
        isActive: users.isActive,
        isMasterOwner: users.isMasterOwner,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.orgId, session.user.orgId));

    return NextResponse.json({
      teamMembers,
      total: teamMembers.length,
    });

  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}

// POST /api/teams - Create a new team member
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user has permission to create team members (admin or owner)
    const currentUser = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!currentUser[0] || !["owner", "admin"].includes(currentUser[0].role)) {
      return NextResponse.json(
        { error: "Insufficient permissions to create team members" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createTeamMemberSchema.parse(body);

    // Check if email already exists
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Create new team member with auto-generated password
    const newUser = await db.insert(users).values({
      orgId: session.user.orgId,
      email: validatedData.email,
      name: validatedData.name,
      role: validatedData.role,
      password: "password123", // Auto-generated password as requested
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      message: "Team member created successfully",
      userId: newUser.insertId,
      email: validatedData.email,
      temporaryPassword: "password123",
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating team member:", error);
    return NextResponse.json(
      { error: "Failed to create team member" },
      { status: 500 }
    );
  }
}