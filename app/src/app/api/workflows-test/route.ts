import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workflows } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

// Schema for creating/updating workflow with React Flow data
const workflowSchema = z.object({
  name: z.string().min(1, "Workflow name is required"),
  description: z.string().optional(),
  trigger: z.string().optional(),
  enabled: z.boolean().default(true),
  status: z.enum(["active", "inactive", "draft", "archived"]).default("draft"),
  blocks: z.any().optional(), // React Flow nodes
  connections: z.any().optional(), // React Flow edges
});

// GET /api/workflows-test - Get all workflows for org 15 (testing)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = parseInt(searchParams.get('orgId') || '15'); // Default to org 15

    // Get workflows with React Flow data
    const workflowList = await db
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
      .where(eq(workflows.orgId, orgId))
      .orderBy(desc(workflows.createdAt));

    return NextResponse.json({
      workflows: workflowList,
      total: workflowList.length,
      message: "Workflows with React Flow data retrieved successfully",
    });

  } catch (error) {
    console.error("Error fetching workflows:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflows", details: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/workflows-test - Create a new workflow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = workflowSchema.parse(body);

    // Create new workflow with React Flow data
    const newWorkflow = await db.insert(workflows).values({
      orgId: 15, // Fixed org for testing
      name: validatedData.name,
      description: validatedData.description || '',
      trigger: validatedData.trigger || 'manual',
      enabled: validatedData.enabled,
      status: validatedData.status,
      blocks: validatedData.blocks || null,
      connections: validatedData.connections || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      runCount: 0,
    });

    return NextResponse.json({
      message: "Workflow created successfully",
      workflowId: newWorkflow.insertId,
      workflow: {
        id: newWorkflow.insertId,
        name: validatedData.name,
        description: validatedData.description,
        blocks: validatedData.blocks,
        connections: validatedData.connections,
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating workflow:", error);
    return NextResponse.json(
      { error: "Failed to create workflow" },
      { status: 500 }
    );
  }
}