import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workflowDirectories, workflows } from "@/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { z } from "zod";

// Schema for creating a new directory
const createDirectorySchema = z.object({
  name: z.string().min(1, "Directory name is required"),
  description: z.string().optional(),
  parentId: z.number().optional(),
  color: z.string().optional(),
});

// GET /api/workflow-directories - Get directories with hierarchy
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = Number(searchParams.get('orgId')) || 1; // For testing
    const includeArchived = searchParams.get('includeArchived') === 'true';

    // Get all directories for the organization
    let query = db
      .select({
        directory: workflowDirectories,
        workflowCount: sql`(SELECT COUNT(*) FROM ${workflows} WHERE directory_id = ${workflowDirectories.id})`,
      })
      .from(workflowDirectories)
      .where(
        and(
          eq(workflowDirectories.orgId, orgId),
          includeArchived ? undefined : eq(workflowDirectories.isArchived, false)
        )
      );

    const allDirectories = await query;

    // Build hierarchical structure
    const directoryMap = new Map();
    const rootDirectories: any[] = [];

    // First pass: create directory objects
    allDirectories.forEach(item => {
      const directory = {
        ...item.directory,
        workflowCount: Number(item.workflowCount),
        children: []
      };
      directoryMap.set(directory.id, directory);
    });

    // Second pass: build hierarchy
    allDirectories.forEach(item => {
      const directory = directoryMap.get(item.directory.id);
      if (directory.parentId) {
        const parent = directoryMap.get(directory.parentId);
        if (parent) {
          parent.children.push(directory);
        }
      } else {
        rootDirectories.push(directory);
      }
    });

    return NextResponse.json({
      directories: rootDirectories,
      total: allDirectories.length,
    });

  } catch (error) {
    console.error("Error fetching workflow directories:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflow directories" },
      { status: 500 }
    );
  }
}

// POST /api/workflow-directories - Create a new directory
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createDirectorySchema.parse(body);
    const orgId = Number(body.orgId) || 1; // For testing
    const createdBy = Number(body.createdBy) || 1; // For testing

    // Verify parent directory exists if specified
    if (validatedData.parentId) {
      const parentDirectory = await db
        .select()
        .from(workflowDirectories)
        .where(
          and(
            eq(workflowDirectories.id, validatedData.parentId),
            eq(workflowDirectories.orgId, orgId)
          )
        )
        .limit(1);

      if (parentDirectory.length === 0) {
        return NextResponse.json(
          { error: "Parent directory not found" },
          { status: 404 }
        );
      }
    }

    // Create new directory
    const newDirectory = await db.insert(workflowDirectories).values({
      orgId: orgId,
      name: validatedData.name,
      description: validatedData.description || '',
      parentId: validatedData.parentId,
      color: validatedData.color || '#6366f1',
      createdBy: createdBy,
    });

    return NextResponse.json({
      message: "Directory created successfully",
      directoryId: newDirectory.insertId,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating workflow directory:", error);
    return NextResponse.json(
      { error: "Failed to create workflow directory" },
      { status: 500 }
    );
  }
}