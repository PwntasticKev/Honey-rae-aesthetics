import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { files, clients } from "@/db/schema";
import { eq, and, desc, like, or, sql, asc } from "drizzle-orm";
import { z } from "zod";

// Schema for creating a new file record
const createFileSchema = z.object({
  clientId: z.number().positive("Client ID is required"),
  filename: z.string().min(1, "Filename is required"),
  url: z.string().url("Valid URL is required"),
  type: z.enum(["photo", "document"], { required_error: "Type must be 'photo' or 'document'" }),
  tags: z.array(z.string()).optional().default([]),
  metadata: z.record(z.any()).optional(),
});

// Schema for file filtering and search
const fileFilterSchema = z.object({
  search: z.string().optional(),
  clientId: z.number().optional(),
  type: z.enum(["all", "photo", "document"]).optional().default("all"),
  tags: z.array(z.string()).optional(),
  sortBy: z.enum(["newest", "oldest", "filename", "client"]).default("newest"),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(50),
});

// GET /api/files - Get files with advanced filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const {
      search = "",
      clientId,
      type = "all",
      tags = [],
      sortBy = "newest",
      page = 1,
      limit = 50
    } = fileFilterSchema.parse(Object.fromEntries(searchParams));

    const offset = (page - 1) * limit;

    // Build dynamic query for files with client details
    let fileQuery = db
      .select({
        id: files.id,
        clientId: files.clientId,
        filename: files.filename,
        url: files.url,
        type: files.type,
        tags: files.tags,
        metadata: files.metadata,
        createdAt: files.createdAt,
        // Client details
        clientName: clients.fullName,
        clientEmail: clients.email,
        // File statistics
        fileSize: sql<number>`CAST(JSON_UNQUOTE(JSON_EXTRACT(${files.metadata}, '$.size')) AS UNSIGNED)`.as('fileSize'),
        mimeType: sql<string>`JSON_UNQUOTE(JSON_EXTRACT(${files.metadata}, '$.mimeType'))`.as('mimeType'),
      })
      .from(files)
      .leftJoin(clients, eq(files.clientId, clients.id))
      .where(eq(files.orgId, session.user.orgId));

    // Apply search filter
    if (search) {
      fileQuery = fileQuery.where(
        or(
          like(files.filename, `%${search}%`),
          like(clients.fullName, `%${search}%`),
          like(clients.email, `%${search}%`)
        )
      );
    }

    // Apply type filter
    if (type !== "all") {
      fileQuery = fileQuery.where(eq(files.type, type));
    }

    // Apply client filter
    if (clientId) {
      fileQuery = fileQuery.where(eq(files.clientId, clientId));
    }

    // Apply tag filters
    if (tags.length > 0) {
      const tagConditions = tags.map(tag => 
        sql`JSON_CONTAINS(${files.tags}, JSON_QUOTE(${tag}))`
      );
      fileQuery = fileQuery.where(
        tagConditions.reduce((acc, condition) => 
          acc ? sql`${acc} AND ${condition}` : condition
        )
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "newest":
        fileQuery = fileQuery.orderBy(desc(files.createdAt));
        break;
      case "oldest":
        fileQuery = fileQuery.orderBy(asc(files.createdAt));
        break;
      case "filename":
        fileQuery = fileQuery.orderBy(asc(files.filename));
        break;
      case "client":
        fileQuery = fileQuery.orderBy(asc(clients.fullName));
        break;
    }

    // Get paginated results
    const allFiles = await fileQuery
      .limit(limit)
      .offset(offset);

    // Get total count for pagination (with same filters)
    let countQuery = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(files)
      .leftJoin(clients, eq(files.clientId, clients.id))
      .where(eq(files.orgId, session.user.orgId));

    // Apply same filters to count query
    if (search) {
      countQuery = countQuery.where(
        or(
          like(files.filename, `%${search}%`),
          like(clients.fullName, `%${search}%`),
          like(clients.email, `%${search}%`)
        )
      );
    }

    if (type !== "all") {
      countQuery = countQuery.where(eq(files.type, type));
    }

    if (clientId) {
      countQuery = countQuery.where(eq(files.clientId, clientId));
    }

    if (tags.length > 0) {
      const tagConditions = tags.map(tag => 
        sql`JSON_CONTAINS(${files.tags}, JSON_QUOTE(${tag}))`
      );
      countQuery = countQuery.where(
        tagConditions.reduce((acc, condition) => 
          acc ? sql`${acc} AND ${condition}` : condition
        )
      );
    }

    const [{ count: totalFiles }] = await countQuery;

    // Calculate analytics
    const analytics = await getFileAnalytics(session.user.orgId, allFiles);

    const totalPages = Math.ceil(totalFiles / limit);

    return NextResponse.json({
      files: allFiles,
      pagination: {
        page,
        limit,
        totalFiles,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      analytics,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error fetching files:", error);
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}

// POST /api/files - Create a new file record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createFileSchema.parse(body);

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

    // Create new file record
    const newFile = await db.insert(files).values({
      orgId: session.user.orgId,
      clientId: validatedData.clientId,
      filename: validatedData.filename,
      url: validatedData.url,
      type: validatedData.type,
      tags: validatedData.tags,
      metadata: validatedData.metadata,
      createdAt: new Date(),
    });

    // Get the created file with full details
    const createdFile = await db
      .select({
        id: files.id,
        filename: files.filename,
        url: files.url,
        type: files.type,
        tags: files.tags,
        clientName: clients.fullName,
        createdAt: files.createdAt,
      })
      .from(files)
      .leftJoin(clients, eq(files.clientId, clients.id))
      .where(eq(files.id, newFile.insertId as number))
      .limit(1);

    return NextResponse.json({
      message: "File created successfully",
      file: createdFile[0],
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating file:", error);
    return NextResponse.json(
      { error: "Failed to create file" },
      { status: 500 }
    );
  }
}

// Helper function to get file analytics
async function getFileAnalytics(orgId: number, currentFiles: any[]) {
  // Get overall file statistics
  const [fileStats] = await db
    .select({
      totalFiles: sql<number>`COUNT(*)`,
      totalPhotos: sql<number>`SUM(CASE WHEN ${files.type} = 'photo' THEN 1 ELSE 0 END)`,
      totalDocuments: sql<number>`SUM(CASE WHEN ${files.type} = 'document' THEN 1 ELSE 0 END)`,
      totalSize: sql<number>`SUM(CAST(IFNULL(JSON_UNQUOTE(JSON_EXTRACT(${files.metadata}, '$.size')), 0) AS UNSIGNED))`,
    })
    .from(files)
    .where(eq(files.orgId, orgId));

  // Get file type distribution for current page
  const typeDistribution = {
    photos: currentFiles.filter(f => f.type === "photo").length,
    documents: currentFiles.filter(f => f.type === "document").length,
  };

  // Get popular tags from current files
  const allTags = currentFiles.flatMap(f => f.tags || []);
  const tagCounts = allTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const popularTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  // Get client file statistics
  const clientStats = currentFiles.reduce((acc, file) => {
    const clientName = file.clientName || "Unknown Client";
    if (!acc[clientName]) {
      acc[clientName] = {
        clientName,
        fileCount: 0,
        photos: 0,
        documents: 0,
      };
    }
    acc[clientName].fileCount++;
    if (file.type === "photo") acc[clientName].photos++;
    if (file.type === "document") acc[clientName].documents++;
    return acc;
  }, {} as Record<string, any>);

  const topClientsByFiles = Object.values(clientStats)
    .sort((a: any, b: any) => b.fileCount - a.fileCount)
    .slice(0, 5);

  return {
    overview: {
      totalFiles: fileStats.totalFiles,
      totalPhotos: fileStats.totalPhotos,
      totalDocuments: fileStats.totalDocuments,
      totalSize: fileStats.totalSize,
      averageFileSize: fileStats.totalFiles > 0 
        ? Math.round(fileStats.totalSize / fileStats.totalFiles) 
        : 0,
    },
    currentPage: {
      typeDistribution,
      filesShown: currentFiles.length,
    },
    popularTags,
    topClientsByFiles,
  };
}