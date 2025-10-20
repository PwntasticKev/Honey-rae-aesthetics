import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { s3Service } from "@/lib/aws";
import { db } from "@/lib/db";
import { files, clients } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

// Schema for upload parameters
const uploadSchema = z.object({
  clientId: z.number().positive("Client ID is required"),
  type: z.enum(["photo", "document"], { required_error: "Type must be 'photo' or 'document'" }),
  tags: z.array(z.string()).optional().default([]),
  description: z.string().optional(),
  makePublic: z.boolean().optional().default(false),
});

// POST /api/files/upload - Handle file uploads
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const clientId = parseInt(formData.get("clientId") as string);
    const type = formData.get("type") as string;
    const tagsString = formData.get("tags") as string;
    const description = formData.get("description") as string;
    const makePublic = formData.get("makePublic") === "true";
    
    let tags: string[] = [];
    try {
      tags = tagsString ? JSON.parse(tagsString) : [];
    } catch {
      tags = [];
    }

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate input using schema
    const validatedData = uploadSchema.parse({
      clientId,
      type,
      tags,
      description,
      makePublic,
    });

    // Verify client exists and belongs to this org
    const client = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.id, validatedData.clientId),
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

    // Validate file type and size
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Validate file type based on type parameter
    const allowedPhotoTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    const allowedDocumentTypes = [
      "application/pdf", 
      "application/msword", 
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain"
    ];

    if (validatedData.type === "photo" && !allowedPhotoTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid photo file type. Allowed: JPEG, PNG, GIF, WebP" },
        { status: 400 }
      );
    }

    if (validatedData.type === "document" && !allowedDocumentTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid document file type. Allowed: PDF, DOC, DOCX, TXT" },
        { status: 400 }
      );
    }

    // Convert file to buffer for S3 upload
    const buffer = Buffer.from(await file.arrayBuffer());

    // Determine S3 folder based on file type
    const s3Folder = validatedData.type === "photo" ? "treatments" : "documents";

    // Upload to S3
    const fileInfo = await s3Service.uploadFile(buffer, file.type, {
      folder: s3Folder,
      fileName: file.name,
      makePublic: validatedData.makePublic,
      metadata: {
        uploadedBy: session.user.id.toString(),
        orgId: session.user.orgId.toString(),
        clientId: validatedData.clientId.toString(),
        description: validatedData.description || "",
        originalName: file.name,
      },
      tags: {
        type: validatedData.type,
        orgId: session.user.orgId.toString(),
        clientId: validatedData.clientId.toString(),
        uploadedBy: session.user.id.toString(),
      },
    });

    // Prepare file metadata
    const metadata = {
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
      uploadedBy: session.user.id,
      uploadedAt: new Date().toISOString(),
      s3Key: fileInfo.key,
      s3Folder: s3Folder,
      isPublic: validatedData.makePublic,
      description: validatedData.description,
    };

    // Create file record in database
    const newFile = await db.insert(files).values({
      orgId: session.user.orgId,
      clientId: validatedData.clientId,
      filename: file.name,
      url: fileInfo.url,
      type: validatedData.type,
      tags: validatedData.tags,
      metadata: metadata,
      createdAt: new Date(),
    });

    // Get the created file with client details
    const createdFile = await db
      .select({
        id: files.id,
        filename: files.filename,
        url: files.url,
        type: files.type,
        tags: files.tags,
        metadata: files.metadata,
        clientName: clients.fullName,
        createdAt: files.createdAt,
      })
      .from(files)
      .leftJoin(clients, eq(files.clientId, clients.id))
      .where(eq(files.id, newFile.insertId as number))
      .limit(1);

    return NextResponse.json({
      message: "File uploaded successfully",
      file: {
        ...createdFile[0],
        s3Key: fileInfo.key,
        downloadUrl: validatedData.makePublic 
          ? fileInfo.url 
          : await s3Service.getSignedUrl(fileInfo.key),
      },
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

// GET /api/files/upload - Get upload configuration and limits
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      limits: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedPhotoTypes: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
        allowedDocumentTypes: [
          "application/pdf", 
          "application/msword", 
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "text/plain"
        ],
        maxFilesPerUpload: 10,
      },
      features: {
        s3Integration: true, // ✅ S3 integration implemented
        imageResizing: false, // TODO: Implement image processing
        virusScanning: false, // TODO: Implement virus scanning
        presignedUrls: true, // ✅ Pre-signed URLs for secure access
        publicUrls: true, // ✅ Optional public URLs
      },
    });

  } catch (error) {
    console.error("Error getting upload config:", error);
    return NextResponse.json(
      { error: "Failed to get upload configuration" },
      { status: 500 }
    );
  }
}