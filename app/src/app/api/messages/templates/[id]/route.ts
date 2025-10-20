import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { enhancedMessageTemplates } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

// Schema for updating a message template
const updateTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").optional(),
  description: z.string().optional(),
  subject: z.string().optional(),
  content: z.string().min(1, "Content is required").optional(),
  imageUrl: z.string().url().optional(),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/messages/templates/[id] - Get a specific message template
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

    const templateId = parseInt(params.id);
    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: "Invalid template ID" },
        { status: 400 }
      );
    }

    const template = await db
      .select()
      .from(enhancedMessageTemplates)
      .where(
        and(
          eq(enhancedMessageTemplates.id, templateId),
          eq(enhancedMessageTemplates.orgId, session.user.orgId)
        )
      )
      .limit(1);

    if (template.length === 0) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      template: template[0],
    });

  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

// PUT /api/messages/templates/[id] - Update a specific message template
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

    const templateId = parseInt(params.id);
    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: "Invalid template ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateTemplateSchema.parse(body);

    // Verify template exists and belongs to this org
    const existingTemplate = await db
      .select()
      .from(enhancedMessageTemplates)
      .where(
        and(
          eq(enhancedMessageTemplates.id, templateId),
          eq(enhancedMessageTemplates.orgId, session.user.orgId)
        )
      )
      .limit(1);

    if (existingTemplate.length === 0) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Extract variables from updated content if provided
    let updatedVariables = existingTemplate[0].variables;
    if (validatedData.content) {
      const variableRegex = /\{\{(\w+)\}\}/g;
      const extractedVariables = new Set<string>();
      let match;
      
      // Extract from content
      while ((match = variableRegex.exec(validatedData.content)) !== null) {
        extractedVariables.add(match[1]);
      }
      
      // Extract from subject if provided
      const subjectToCheck = validatedData.subject !== undefined ? validatedData.subject : existingTemplate[0].subject;
      if (subjectToCheck) {
        const subjectVariableRegex = /\{\{(\w+)\}\}/g;
        let subjectMatch;
        while ((subjectMatch = subjectVariableRegex.exec(subjectToCheck)) !== null) {
          extractedVariables.add(subjectMatch[1]);
        }
      }
      
      updatedVariables = Array.from(extractedVariables);
    }

    // Update template
    await db
      .update(enhancedMessageTemplates)
      .set({
        ...validatedData,
        variables: updatedVariables,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(enhancedMessageTemplates.id, templateId),
          eq(enhancedMessageTemplates.orgId, session.user.orgId)
        )
      );

    return NextResponse.json({
      message: "Template updated successfully",
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating template:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

// DELETE /api/messages/templates/[id] - Delete a specific message template
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

    const templateId = parseInt(params.id);
    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: "Invalid template ID" },
        { status: 400 }
      );
    }

    // Verify template exists and belongs to this org
    const existingTemplate = await db
      .select()
      .from(enhancedMessageTemplates)
      .where(
        and(
          eq(enhancedMessageTemplates.id, templateId),
          eq(enhancedMessageTemplates.orgId, session.user.orgId)
        )
      )
      .limit(1);

    if (existingTemplate.length === 0) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // TODO: Check for dependencies (active campaigns, scheduled messages, etc.)
    // For now, we'll allow deletion but in production should check:
    // - Active message campaigns using this template
    // - Scheduled messages using this template
    // - Workflow steps using this template

    // Delete template
    await db
      .delete(enhancedMessageTemplates)
      .where(
        and(
          eq(enhancedMessageTemplates.id, templateId),
          eq(enhancedMessageTemplates.orgId, session.user.orgId)
        )
      );

    return NextResponse.json({
      message: "Template deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}