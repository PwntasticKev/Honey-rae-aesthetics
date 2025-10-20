import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { enhancedMessageTemplates, users, templateVariables } from "@/db/schema";
import { eq, and, desc, like, or } from "drizzle-orm";
import { z } from "zod";

// Schema for creating message templates
const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  type: z.enum(["sms", "email"]),
  subject: z.string().optional(), // Required for email templates
  content: z.string().min(1, "Template content is required"),
  variables: z.array(z.string()).default([]), // Array of variable keys used
  imageUrl: z.string().url().optional(),
  category: z.string().optional(),
}).refine((data) => {
  // Subject is required for email templates
  if (data.type === "email" && !data.subject) {
    return false;
  }
  return true;
}, {
  message: "Subject is required for email templates",
  path: ["subject"],
});

// Schema for updating message templates
const updateTemplateSchema = createTemplateSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// Schema for template filtering
const templateFiltersSchema = z.object({
  type: z.enum(["sms", "email"]).optional(),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

// GET /api/templates - List message templates
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
    const filters = templateFiltersSchema.parse({
      type: searchParams.get('type') || undefined,
      category: searchParams.get('category') || undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    });

    // Build where conditions
    let whereConditions = eq(enhancedMessageTemplates.orgId, session.user.orgId);

    if (filters.type) {
      whereConditions = and(whereConditions, eq(enhancedMessageTemplates.type, filters.type));
    }

    if (filters.category) {
      whereConditions = and(whereConditions, eq(enhancedMessageTemplates.category, filters.category));
    }

    if (filters.isActive !== undefined) {
      whereConditions = and(whereConditions, eq(enhancedMessageTemplates.isActive, filters.isActive));
    }

    if (filters.search) {
      whereConditions = and(
        whereConditions,
        or(
          like(enhancedMessageTemplates.name, `%${filters.search}%`),
          like(enhancedMessageTemplates.description, `%${filters.search}%`),
          like(enhancedMessageTemplates.content, `%${filters.search}%`)
        )
      );
    }

    // Get templates with creator info
    const templates = await db
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
        createdBy: enhancedMessageTemplates.createdBy,
        createdAt: enhancedMessageTemplates.createdAt,
        updatedAt: enhancedMessageTemplates.updatedAt,
        createdByUser: {
          name: users.name,
          email: users.email,
        },
      })
      .from(enhancedMessageTemplates)
      .leftJoin(users, eq(enhancedMessageTemplates.createdBy, users.id))
      .where(whereConditions)
      .orderBy(desc(enhancedMessageTemplates.updatedAt))
      .limit(filters.limit)
      .offset(filters.offset);

    // Get total count for pagination
    const totalResult = await db
      .select({ count: sql`COUNT(*)` })
      .from(enhancedMessageTemplates)
      .where(whereConditions);

    const total = totalResult[0]?.count || 0;

    // Get available categories for filtering
    const categoriesResult = await db
      .select({ category: enhancedMessageTemplates.category })
      .from(enhancedMessageTemplates)
      .where(
        and(
          eq(enhancedMessageTemplates.orgId, session.user.orgId),
          sql`${enhancedMessageTemplates.category} IS NOT NULL`
        )
      )
      .groupBy(enhancedMessageTemplates.category);

    const categories = categoriesResult.map(c => c.category).filter(Boolean);

    return NextResponse.json({
      templates,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: filters.offset + filters.limit < total,
      },
      filters: {
        categories,
        applied: filters,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid filters", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error fetching message templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch message templates" },
      { status: 500 }
    );
  }
}

// POST /api/templates - Create new message template
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

    // Validate that referenced variables exist
    if (validatedData.variables.length > 0) {
      const existingVariables = await db
        .select({ variableKey: templateVariables.variableKey })
        .from(templateVariables)
        .where(
          and(
            eq(templateVariables.orgId, session.user.orgId),
            sql`${templateVariables.variableKey} IN (${validatedData.variables.join(',')})`
          )
        );

      const existingKeys = existingVariables.map(v => v.variableKey);
      const missingVariables = validatedData.variables.filter(v => !existingKeys.includes(v));

      if (missingVariables.length > 0) {
        return NextResponse.json(
          { 
            error: "Invalid variables referenced", 
            missingVariables 
          },
          { status: 400 }
        );
      }
    }

    // Check if template name already exists
    const existingTemplate = await db
      .select()
      .from(enhancedMessageTemplates)
      .where(
        and(
          eq(enhancedMessageTemplates.orgId, session.user.orgId),
          eq(enhancedMessageTemplates.name, validatedData.name)
        )
      )
      .limit(1);

    if (existingTemplate.length > 0) {
      return NextResponse.json(
        { error: "Template name already exists" },
        { status: 409 }
      );
    }

    const newTemplate = await db
      .insert(enhancedMessageTemplates)
      .values({
        orgId: session.user.orgId,
        name: validatedData.name,
        description: validatedData.description,
        type: validatedData.type,
        subject: validatedData.subject,
        content: validatedData.content,
        variables: validatedData.variables,
        imageUrl: validatedData.imageUrl,
        category: validatedData.category,
        isActive: true,
        usageCount: 0,
        createdBy: session.user.id,
      });

    return NextResponse.json(
      {
        message: "Message template created successfully",
        templateId: newTemplate.insertId,
      },
      { status: 201 }
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating message template:", error);
    return NextResponse.json(
      { error: "Failed to create message template" },
      { status: 500 }
    );
  }
}

// Helper function to extract variables from template content
export function extractVariablesFromContent(content: string): string[] {
  const variableRegex = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
  const variables: string[] = [];
  let match;

  while ((match = variableRegex.exec(content)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
}

// Helper function to validate template content
export function validateTemplateContent(content: string, availableVariables: string[]): {
  isValid: boolean;
  missingVariables: string[];
  unusedVariables: string[];
} {
  const usedVariables = extractVariablesFromContent(content);
  const missingVariables = usedVariables.filter(v => !availableVariables.includes(v));
  const unusedVariables = availableVariables.filter(v => !usedVariables.includes(v));

  return {
    isValid: missingVariables.length === 0,
    missingVariables,
    unusedVariables,
  };
}