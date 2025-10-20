import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { files } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

// Schema for updating a file
const updateFileSchema = z.object({
  filename: z.string().min(1, "Filename is required").optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

// GET /api/files/[id] - Get a specific file
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

    const fileId = parseInt(params.id);
    if (isNaN(fileId)) {
      return NextResponse.json(
        { error: "Invalid file ID" },
        { status: 400 }
      );
    }

    const file = await db
      .select()
      .from(files)
      .where(
        and(
          eq(files.id, fileId),
          eq(files.orgId, session.user.orgId)
        )
      )
      .limit(1);

    if (file.length === 0) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      file: file[0],
    });

  } catch (error) {
    console.error("Error fetching file:", error);
    return NextResponse.json(
      { error: "Failed to fetch file" },
      { status: 500 }
    );
  }
}

// PUT /api/files/[id] - Update a specific file
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

    const fileId = parseInt(params.id);
    if (isNaN(fileId)) {
      return NextResponse.json(
        { error: "Invalid file ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateFileSchema.parse(body);

    // Verify file exists and belongs to this org
    const existingFile = await db
      .select()
      .from(files)
      .where(
        and(
          eq(files.id, fileId),
          eq(files.orgId, session.user.orgId)
        )
      )
      .limit(1);

    if (existingFile.length === 0) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Update file
    await db
      .update(files)
      .set(validatedData)
      .where(
        and(
          eq(files.id, fileId),
          eq(files.orgId, session.user.orgId)
        )
      );

    return NextResponse.json({
      message: "File updated successfully",
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating file:", error);
    return NextResponse.json(
      { error: "Failed to update file" },
      { status: 500 }
    );
  }
}

// DELETE /api/files/[id] - Delete a specific file
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

    const fileId = parseInt(params.id);
    if (isNaN(fileId)) {
      return NextResponse.json(
        { error: "Invalid file ID" },
        { status: 400 }
      );
    }

    // Verify file exists and belongs to this org
    const existingFile = await db
      .select()
      .from(files)
      .where(
        and(
          eq(files.id, fileId),
          eq(files.orgId, session.user.orgId)
        )
      )
      .limit(1);

    if (existingFile.length === 0) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // TODO: Delete actual file from AWS S3
    // This should be implemented when S3 integration is added
    // await deleteFileFromS3(existingFile[0].url);

    // Delete file record from database
    await db
      .delete(files)
      .where(
        and(
          eq(files.id, fileId),
          eq(files.orgId, session.user.orgId)
        )
      );

    return NextResponse.json({
      message: "File deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}