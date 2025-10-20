import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { clients } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

// Schema for updating a client
const updateClientSchema = z.object({
  fullName: z.string().min(1, "Full name is required").optional(),
  email: z.string().email().optional(),
  phones: z.array(z.string()).optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  preferredContactMethod: z.enum(["email", "phone", "sms"]).optional(),
  tags: z.array(z.string()).optional(),
});

// GET /api/clients/[id] - Get a specific client
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const clientId = parseInt(params.id);
    if (isNaN(clientId)) {
      return NextResponse.json(
        { error: "Invalid client ID" },
        { status: 400 }
      );
    }

    const client = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.id, clientId),
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

    return NextResponse.json({
      client: client[0],
    });

  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: "Failed to fetch client" },
      { status: 500 }
    );
  }
}

// PUT /api/clients/[id] - Update a specific client
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const clientId = parseInt(params.id);
    if (isNaN(clientId)) {
      return NextResponse.json(
        { error: "Invalid client ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateClientSchema.parse(body);

    // Verify client exists and belongs to this org
    const existingClient = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.id, clientId),
          eq(clients.orgId, session.user.orgId)
        )
      )
      .limit(1);

    if (existingClient.length === 0) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Update client
    await db
      .update(clients)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(clients.id, clientId),
          eq(clients.orgId, session.user.orgId)
        )
      );

    return NextResponse.json({
      message: "Client updated successfully",
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id] - Delete a specific client
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const clientId = parseInt(params.id);
    if (isNaN(clientId)) {
      return NextResponse.json(
        { error: "Invalid client ID" },
        { status: 400 }
      );
    }

    // Verify client exists and belongs to this org
    const existingClient = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.id, clientId),
          eq(clients.orgId, session.user.orgId)
        )
      )
      .limit(1);

    if (existingClient.length === 0) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // TODO: Check for dependencies (appointments, files, etc.)
    // For now, we'll allow deletion but in production should check:
    // - Active appointments
    // - Files/documents
    // - Workflow enrollments
    // - Message history

    // Delete client
    await db
      .delete(clients)
      .where(
        and(
          eq(clients.id, clientId),
          eq(clients.orgId, session.user.orgId)
        )
      );

    return NextResponse.json({
      message: "Client deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 }
    );
  }
}