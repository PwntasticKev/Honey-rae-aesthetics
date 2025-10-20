import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workflows } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/workflows/simple - Get all workflows (no auth for testing)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = Number(searchParams.get('orgId')) || 1; // Default to org 1 for testing

    // Get workflows
    const workflowList = await db
      .select()
      .from(workflows)
      .where(eq(workflows.orgId, orgId))
      .orderBy(desc(workflows.createdAt));

    return NextResponse.json({
      workflows: workflowList,
      total: workflowList.length,
      message: "Workflows retrieved successfully (no auth)",
      migrationStatus: "Database migration complete - Drizzle integration ready"
    });

  } catch (error) {
    console.error("Error fetching workflows:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflows", details: String(error) },
      { status: 500 }
    );
  }
}