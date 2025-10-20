import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { templateVariables } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

// Schema for updating template variables
const updateVariableSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  variableKey: z.string().min(1).regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/).optional(),
  defaultValue: z.string().optional(),
  dataType: z.enum(["string", "number", "date", "boolean"]).optional(),
});

// GET /api/templates/variables/[id] - Get specific template variable
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

    const variableId = parseInt(params.id);
    if (isNaN(variableId)) {
      return NextResponse.json(
        { error: "Invalid variable ID" },
        { status: 400 }
      );
    }

    const variable = await db
      .select()
      .from(templateVariables)
      .where(
        and(
          eq(templateVariables.id, variableId),
          eq(templateVariables.orgId, session.user.orgId)
        )
      )
      .limit(1);

    if (variable.length === 0) {
      return NextResponse.json(
        { error: "Template variable not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ variable: variable[0] });

  } catch (error) {
    console.error("Error fetching template variable:", error);
    return NextResponse.json(
      { error: "Failed to fetch template variable" },
      { status: 500 }
    );
  }
}

// PATCH /api/templates/variables/[id] - Update template variable
export async function PATCH(
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

    const variableId = parseInt(params.id);
    if (isNaN(variableId)) {
      return NextResponse.json(
        { error: "Invalid variable ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateVariableSchema.parse(body);

    // Check if variable exists and belongs to this org
    const existingVariable = await db
      .select()
      .from(templateVariables)
      .where(
        and(
          eq(templateVariables.id, variableId),
          eq(templateVariables.orgId, session.user.orgId)
        )
      )
      .limit(1);

    if (existingVariable.length === 0) {
      return NextResponse.json(
        { error: "Template variable not found" },
        { status: 404 }
      );
    }

    // Don't allow editing system variables
    if (existingVariable[0].isSystem) {
      return NextResponse.json(
        { error: "System variables cannot be modified" },
        { status: 403 }
      );
    }

    // Check if new variable key conflicts with existing variables
    if (validatedData.variableKey && validatedData.variableKey !== existingVariable[0].variableKey) {
      const conflictingVariable = await db
        .select()
        .from(templateVariables)
        .where(
          and(
            eq(templateVariables.orgId, session.user.orgId),
            eq(templateVariables.variableKey, validatedData.variableKey),
            // Exclude current variable from conflict check
            sql`id != ${variableId}`
          )
        )
        .limit(1);

      if (conflictingVariable.length > 0) {
        return NextResponse.json(
          { error: "Variable key already exists" },
          { status: 409 }
        );
      }
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.variableKey !== undefined) updateData.variableKey = validatedData.variableKey;
    if (validatedData.defaultValue !== undefined) updateData.defaultValue = validatedData.defaultValue;
    if (validatedData.dataType !== undefined) updateData.dataType = validatedData.dataType;

    await db
      .update(templateVariables)
      .set(updateData)
      .where(eq(templateVariables.id, variableId));

    return NextResponse.json({
      message: "Template variable updated successfully",
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating template variable:", error);
    return NextResponse.json(
      { error: "Failed to update template variable" },
      { status: 500 }
    );
  }
}

// DELETE /api/templates/variables/[id] - Delete template variable
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

    const variableId = parseInt(params.id);
    if (isNaN(variableId)) {
      return NextResponse.json(
        { error: "Invalid variable ID" },
        { status: 400 }
      );
    }

    // Check if variable exists and belongs to this org
    const existingVariable = await db
      .select()
      .from(templateVariables)
      .where(
        and(
          eq(templateVariables.id, variableId),
          eq(templateVariables.orgId, session.user.orgId)
        )
      )
      .limit(1);

    if (existingVariable.length === 0) {
      return NextResponse.json(
        { error: "Template variable not found" },
        { status: 404 }
      );
    }

    // Don't allow deleting system variables
    if (existingVariable[0].isSystem) {
      return NextResponse.json(
        { error: "System variables cannot be deleted" },
        { status: 403 }
      );
    }

    // TODO: Check if variable is used in any templates before deleting
    // For now, we'll allow deletion but this should be implemented

    await db
      .delete(templateVariables)
      .where(eq(templateVariables.id, variableId));

    return NextResponse.json({
      message: "Template variable deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting template variable:", error);
    return NextResponse.json(
      { error: "Failed to delete template variable" },
      { status: 500 }
    );
  }
}