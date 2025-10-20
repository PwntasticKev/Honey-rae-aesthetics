import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workflows } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Schema for updating workflow
const updateWorkflowSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  trigger: z.string().optional(),
  enabled: z.boolean().optional(),
  status: z.enum(["active", "inactive", "draft", "archived"]).optional(),
  blocks: z.any().optional(), // React Flow nodes
  connections: z.any().optional(), // React Flow edges
});

// GET /api/workflows-test/[id] - Get specific workflow
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = parseInt(params.id);
    
    if (isNaN(workflowId)) {
      return NextResponse.json(
        { error: "Invalid workflow ID" },
        { status: 400 }
      );
    }

    // Get single workflow with React Flow data
    const workflow = await db
      .select({
        id: workflows.id,
        orgId: workflows.orgId,
        name: workflows.name,
        description: workflows.description,
        trigger: workflows.trigger,
        enabled: workflows.enabled,
        status: workflows.status,
        blocks: workflows.blocks,
        connections: workflows.connections,
        createdAt: workflows.createdAt,
        updatedAt: workflows.updatedAt,
        lastRun: workflows.lastRun,
        runCount: workflows.runCount,
      })
      .from(workflows)
      .where(eq(workflows.id, workflowId))
      .limit(1);

    if (!workflow.length) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      workflow: workflow[0],
      message: "Workflow retrieved successfully",
    });

  } catch (error) {
    console.error("Error fetching workflow:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflow" },
      { status: 500 }
    );
  }
}

// PATCH /api/workflows-test/[id] - Update workflow with React Flow data
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = parseInt(params.id);
    
    if (isNaN(workflowId)) {
      return NextResponse.json(
        { error: "Invalid workflow ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateWorkflowSchema.parse(body);

    // Prepare update data - only include fields that were provided
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.trigger !== undefined) updateData.trigger = validatedData.trigger;
    if (validatedData.enabled !== undefined) updateData.enabled = validatedData.enabled;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;
    if (validatedData.blocks !== undefined) updateData.blocks = validatedData.blocks;
    if (validatedData.connections !== undefined) updateData.connections = validatedData.connections;

    // Update workflow
    const result = await db
      .update(workflows)
      .set(updateData)
      .where(eq(workflows.id, workflowId));

    // Get updated workflow to return
    const updatedWorkflow = await db
      .select()
      .from(workflows)
      .where(eq(workflows.id, workflowId))
      .limit(1);

    return NextResponse.json({
      message: "Workflow updated successfully",
      workflow: updatedWorkflow[0] || null,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating workflow:", error);
    return NextResponse.json(
      { error: "Failed to update workflow" },
      { status: 500 }
    );
  }
}

// DELETE /api/workflows-test/[id] - Delete workflow
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = parseInt(params.id);
    
    if (isNaN(workflowId)) {
      return NextResponse.json(
        { error: "Invalid workflow ID" },
        { status: 400 }
      );
    }

    // Delete workflow
    await db
      .delete(workflows)
      .where(eq(workflows.id, workflowId));

    return NextResponse.json({
      message: "Workflow deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting workflow:", error);
    return NextResponse.json(
      { error: "Failed to delete workflow" },
      { status: 500 }
    );
  }
}