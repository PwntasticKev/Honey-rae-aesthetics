import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

// Schema for updating a team member
const updateTeamMemberSchema = z.object({
  role: z.enum(["owner", "admin", "manager", "staff"]).optional(),
  isActive: z.boolean().optional(),
  name: z.string().min(1).optional(),
});

// PATCH /api/teams/[id] - Update team member role/status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = parseInt(params.id);
    const body = await request.json();
    const validatedData = updateTeamMemberSchema.parse(body);

    // Get current user's role
    const currentUser = await db
      .select({ role: users.role, isMasterOwner: users.isMasterOwner })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!currentUser[0]) {
      return NextResponse.json(
        { error: "Current user not found" },
        { status: 404 }
      );
    }

    // Get target user to check permissions and prevent self-demotion
    const targetUser = await db
      .select({ role: users.role, orgId: users.orgId })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.orgId, session.user.orgId)))
      .limit(1);

    if (!targetUser[0]) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    // Permission checks
    const isOwnerOrAdmin = ["owner", "admin"].includes(currentUser[0].role);
    const isMasterOwner = currentUser[0].isMasterOwner;
    
    if (!isOwnerOrAdmin && !isMasterOwner) {
      return NextResponse.json(
        { error: "Insufficient permissions to modify team members" },
        { status: 403 }
      );
    }

    // Prevent self-demotion
    if (userId === session.user.id && validatedData.role && 
        validatedData.role !== currentUser[0].role) {
      return NextResponse.json(
        { error: "Cannot change your own role" },
        { status: 403 }
      );
    }

    // Prevent admins from removing other admins (only owners can do this)
    if (targetUser[0].role === "admin" && validatedData.role && 
        validatedData.role !== "admin" && currentUser[0].role !== "owner" && 
        !currentUser[0].isMasterOwner) {
      return NextResponse.json(
        { error: "Only owners can modify admin roles" },
        { status: 403 }
      );
    }

    // Update the team member
    await db
      .update(users)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, userId), eq(users.orgId, session.user.orgId)));

    return NextResponse.json({
      message: "Team member updated successfully",
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating team member:", error);
    return NextResponse.json(
      { error: "Failed to update team member" },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[id] - Remove team member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = parseInt(params.id);

    // Get current user's role
    const currentUser = await db
      .select({ role: users.role, isMasterOwner: users.isMasterOwner })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!currentUser[0]) {
      return NextResponse.json(
        { error: "Current user not found" },
        { status: 404 }
      );
    }

    // Get target user
    const targetUser = await db
      .select({ role: users.role, orgId: users.orgId })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.orgId, session.user.orgId)))
      .limit(1);

    if (!targetUser[0]) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    // Permission checks
    const isOwnerOrAdmin = ["owner", "admin"].includes(currentUser[0].role);
    const isMasterOwner = currentUser[0].isMasterOwner;
    
    if (!isOwnerOrAdmin && !isMasterOwner) {
      return NextResponse.json(
        { error: "Insufficient permissions to remove team members" },
        { status: 403 }
      );
    }

    // Prevent self-deletion
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot remove yourself" },
        { status: 403 }
      );
    }

    // Prevent admins from removing other admins
    if (targetUser[0].role === "admin" && currentUser[0].role !== "owner" && 
        !currentUser[0].isMasterOwner) {
      return NextResponse.json(
        { error: "Only owners can remove admin users" },
        { status: 403 }
      );
    }

    // Delete the team member
    await db
      .delete(users)
      .where(and(eq(users.id, userId), eq(users.orgId, session.user.orgId)));

    return NextResponse.json({
      message: "Team member removed successfully",
    });

  } catch (error) {
    console.error("Error removing team member:", error);
    return NextResponse.json(
      { error: "Failed to remove team member" },
      { status: 500 }
    );
  }
}