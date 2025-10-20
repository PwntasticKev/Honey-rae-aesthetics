import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { enhancedMessageTemplates, users } from "@/db/schema";
import { eq, and, desc, like, or, sql } from "drizzle-orm";
import { z } from "zod";

// Schema for creating a new message template
const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  type: z.enum(["sms", "email"], { required_error: "Type must be 'sms' or 'email'" }),
  subject: z.string().optional(), // Required for email templates
  content: z.string().min(1, "Content is required"),
  variables: z.array(z.string()).optional().default([]),
  imageUrl: z.string().url().optional(),
  category: z.string().optional(),
}).refine((data) => {
  // If type is email, subject is required
  if (data.type === "email" && !data.subject) {
    return false;
  }
  return true;
}, {
  message: "Subject is required for email templates",
  path: ["subject"],
});

// Schema for template filtering and search
const templateFilterSchema = z.object({
  search: z.string().optional(),
  type: z.enum(["all", "sms", "email"]).optional().default("all"),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
  sortBy: z.enum(["newest", "oldest", "name", "usage"]).default("newest"),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(50),
});

// GET /api/messages/templates - Get message templates with filtering
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
      type = "all",
      category,
      isActive,
      sortBy = "newest",
      page = 1,
      limit = 50
    } = templateFilterSchema.parse(Object.fromEntries(searchParams));

    const offset = (page - 1) * limit;

    // Build dynamic query for templates with creator details
    let templateQuery = db
      .select({
        id: enhancedMessageTemplates.id,
        name: enhancedMessageTemplates.name,
        description: enhancedMessageTemplates.description,
        type: enhancedMessageTemplates.type,
        subject: enhancedMessageTemplates.subject,
        content: enhancedMessageTemplates.content,
        variables: enhancedMessageTemplates.variables,
        imageUrl: enhancedMessageTemplates.imageUrl,
        isActive: enhancedMessageTemplates.isActive,
        category: enhancedMessageTemplates.category,
        usageCount: enhancedMessageTemplates.usageCount,
        lastUsedAt: enhancedMessageTemplates.lastUsedAt,
        createdAt: enhancedMessageTemplates.createdAt,
        updatedAt: enhancedMessageTemplates.updatedAt,
        // Creator details
        createdByName: users.name,
        createdByEmail: users.email,
      })
      .from(enhancedMessageTemplates)
      .leftJoin(users, eq(enhancedMessageTemplates.createdBy, users.id))
      .where(eq(enhancedMessageTemplates.orgId, session.user.orgId));

    // Apply search filter
    if (search) {
      templateQuery = templateQuery.where(
        or(
          like(enhancedMessageTemplates.name, `%${search}%`),
          like(enhancedMessageTemplates.description, `%${search}%`),
          like(enhancedMessageTemplates.content, `%${search}%`),
          like(enhancedMessageTemplates.category, `%${search}%`)
        )
      );
    }

    // Apply type filter
    if (type !== "all") {
      templateQuery = templateQuery.where(eq(enhancedMessageTemplates.type, type));
    }

    // Apply category filter
    if (category) {
      templateQuery = templateQuery.where(eq(enhancedMessageTemplates.category, category));
    }

    // Apply active status filter
    if (isActive !== undefined) {
      templateQuery = templateQuery.where(eq(enhancedMessageTemplates.isActive, isActive));
    }

    // Apply sorting
    switch (sortBy) {
      case "newest":
        templateQuery = templateQuery.orderBy(desc(enhancedMessageTemplates.createdAt));
        break;
      case "oldest":
        templateQuery = templateQuery.orderBy(enhancedMessageTemplates.createdAt);
        break;
      case "name":
        templateQuery = templateQuery.orderBy(enhancedMessageTemplates.name);
        break;
      case "usage":
        templateQuery = templateQuery.orderBy(desc(enhancedMessageTemplates.usageCount));
        break;
    }

    // Get paginated results
    const templates = await templateQuery
      .limit(limit)
      .offset(offset);

    // Get total count for pagination (with same filters)
    let countQuery = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(enhancedMessageTemplates)
      .where(eq(enhancedMessageTemplates.orgId, session.user.orgId));

    // Apply same filters to count query
    if (search) {
      countQuery = countQuery.where(
        or(
          like(enhancedMessageTemplates.name, `%${search}%`),
          like(enhancedMessageTemplates.description, `%${search}%`),
          like(enhancedMessageTemplates.content, `%${search}%`),
          like(enhancedMessageTemplates.category, `%${search}%`)
        )
      );
    }

    if (type !== "all") {
      countQuery = countQuery.where(eq(enhancedMessageTemplates.type, type));
    }

    if (category) {
      countQuery = countQuery.where(eq(enhancedMessageTemplates.category, category));
    }

    if (isActive !== undefined) {
      countQuery = countQuery.where(eq(enhancedMessageTemplates.isActive, isActive));
    }

    const [{ count: totalTemplates }] = await countQuery;

    // Calculate analytics
    const analytics = await getTemplateAnalytics(session.user.orgId);

    const totalPages = Math.ceil(totalTemplates / limit);

    return NextResponse.json({
      templates,
      pagination: {
        page,
        limit,
        totalTemplates,
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

    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST /api/messages/templates - Create a new message template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createTemplateSchema.parse(body);

    // Extract variables from content
    const variableRegex = /\{\{(\w+)\}\}/g;
    const extractedVariables = new Set<string>();
    let match;
    while ((match = variableRegex.exec(validatedData.content)) !== null) {
      extractedVariables.add(match[1]);
    }

    // Also extract from subject if it exists
    if (validatedData.subject) {
      const subjectVariableRegex = /\{\{(\w+)\}\}/g;
      let subjectMatch;
      while ((subjectMatch = subjectVariableRegex.exec(validatedData.subject)) !== null) {
        extractedVariables.add(subjectMatch[1]);
      }
    }

    // Create new template
    const newTemplate = await db.insert(enhancedMessageTemplates).values({
      orgId: session.user.orgId,
      name: validatedData.name,
      description: validatedData.description,
      type: validatedData.type,
      subject: validatedData.subject,
      content: validatedData.content,
      variables: Array.from(extractedVariables),
      imageUrl: validatedData.imageUrl,
      category: validatedData.category,
      isActive: true,
      usageCount: 0,
      createdBy: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Get the created template with full details
    const createdTemplate = await db
      .select({
        id: enhancedMessageTemplates.id,
        name: enhancedMessageTemplates.name,
        type: enhancedMessageTemplates.type,
        subject: enhancedMessageTemplates.subject,
        content: enhancedMessageTemplates.content,
        variables: enhancedMessageTemplates.variables,
        category: enhancedMessageTemplates.category,
        createdByName: users.name,
        createdAt: enhancedMessageTemplates.createdAt,
      })
      .from(enhancedMessageTemplates)
      .leftJoin(users, eq(enhancedMessageTemplates.createdBy, users.id))
      .where(eq(enhancedMessageTemplates.id, newTemplate.insertId as number))
      .limit(1);

    return NextResponse.json({
      message: "Template created successfully",
      template: createdTemplate[0],
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}

// Helper function to get template analytics
async function getTemplateAnalytics(orgId: number) {
  const [stats] = await db
    .select({
      totalTemplates: sql<number>`COUNT(*)`,
      activeTemplates: sql<number>`SUM(CASE WHEN ${enhancedMessageTemplates.isActive} = 1 THEN 1 ELSE 0 END)`,
      emailTemplates: sql<number>`SUM(CASE WHEN ${enhancedMessageTemplates.type} = 'email' THEN 1 ELSE 0 END)`,
      smsTemplates: sql<number>`SUM(CASE WHEN ${enhancedMessageTemplates.type} = 'sms' THEN 1 ELSE 0 END)`,
      totalUsage: sql<number>`SUM(${enhancedMessageTemplates.usageCount})`,
      avgUsage: sql<number>`AVG(${enhancedMessageTemplates.usageCount})`,
    })
    .from(enhancedMessageTemplates)
    .where(eq(enhancedMessageTemplates.orgId, orgId));

  // Get category breakdown
  const categoryStats = await db
    .select({
      category: enhancedMessageTemplates.category,
      count: sql<number>`COUNT(*)`,
      usage: sql<number>`SUM(${enhancedMessageTemplates.usageCount})`,
    })
    .from(enhancedMessageTemplates)
    .where(
      and(
        eq(enhancedMessageTemplates.orgId, orgId),
        sql`${enhancedMessageTemplates.category} IS NOT NULL`
      )
    )
    .groupBy(enhancedMessageTemplates.category)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(10);

  // Get most used templates
  const mostUsedTemplates = await db
    .select({
      id: enhancedMessageTemplates.id,
      name: enhancedMessageTemplates.name,
      type: enhancedMessageTemplates.type,
      usageCount: enhancedMessageTemplates.usageCount,
      lastUsedAt: enhancedMessageTemplates.lastUsedAt,
    })
    .from(enhancedMessageTemplates)
    .where(eq(enhancedMessageTemplates.orgId, orgId))
    .orderBy(desc(enhancedMessageTemplates.usageCount))
    .limit(5);

  return {
    overview: {
      totalTemplates: stats.totalTemplates,
      activeTemplates: stats.activeTemplates,
      emailTemplates: stats.emailTemplates,
      smsTemplates: stats.smsTemplates,
      totalUsage: stats.totalUsage,
      averageUsage: Math.round(stats.avgUsage || 0),
    },
    categoryBreakdown: categoryStats.map(cat => ({
      category: cat.category || "Uncategorized",
      templateCount: cat.count,
      totalUsage: cat.usage,
    })),
    mostUsedTemplates: mostUsedTemplates,
  };
}