import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { templateVariables, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

// Schema for creating template variables
const createVariableSchema = z.object({
  name: z.string().min(1, "Variable name is required"),
  description: z.string().optional(),
  variableKey: z.string().min(1, "Variable key is required").regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Invalid variable key format"),
  defaultValue: z.string().optional(),
  dataType: z.enum(["string", "number", "date", "boolean"]).default("string"),
});

// Schema for updating template variables
const updateVariableSchema = createVariableSchema.partial();

// GET /api/templates/variables - List all template variables
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
    const includeSystem = searchParams.get('includeSystem') === 'true';
    const type = searchParams.get('type'); // 'custom', 'system', or 'all'

    let variables;

    if (type === 'system' || includeSystem) {
      // Get both system and org-specific variables
      variables = await db
        .select({
          id: templateVariables.id,
          name: templateVariables.name,
          description: templateVariables.description,
          variableKey: templateVariables.variableKey,
          defaultValue: templateVariables.defaultValue,
          isCustom: templateVariables.isCustom,
          isSystem: templateVariables.isSystem,
          dataType: templateVariables.dataType,
          createdBy: templateVariables.createdBy,
          createdAt: templateVariables.createdAt,
          updatedAt: templateVariables.updatedAt,
          createdByUser: {
            name: users.name,
            email: users.email,
          },
        })
        .from(templateVariables)
        .leftJoin(users, eq(templateVariables.createdBy, users.id))
        .where(
          type === 'system' 
            ? eq(templateVariables.isSystem, true)
            : and(
                eq(templateVariables.orgId, session.user.orgId),
                eq(templateVariables.isSystem, false)
              )
        )
        .orderBy(desc(templateVariables.createdAt));
    } else {
      // Get only org-specific variables
      variables = await db
        .select({
          id: templateVariables.id,
          name: templateVariables.name,
          description: templateVariables.description,
          variableKey: templateVariables.variableKey,
          defaultValue: templateVariables.defaultValue,
          isCustom: templateVariables.isCustom,
          isSystem: templateVariables.isSystem,
          dataType: templateVariables.dataType,
          createdBy: templateVariables.createdBy,
          createdAt: templateVariables.createdAt,
          updatedAt: templateVariables.updatedAt,
          createdByUser: {
            name: users.name,
            email: users.email,
          },
        })
        .from(templateVariables)
        .leftJoin(users, eq(templateVariables.createdBy, users.id))
        .where(
          and(
            eq(templateVariables.orgId, session.user.orgId),
            eq(templateVariables.isSystem, false)
          )
        )
        .orderBy(desc(templateVariables.createdAt));
    }

    // Group variables by type for easier frontend consumption
    const systemVariables = variables.filter(v => v.isSystem);
    const customVariables = variables.filter(v => v.isCustom && !v.isSystem);

    return NextResponse.json({
      variables: {
        system: systemVariables,
        custom: customVariables,
        all: variables,
      },
      total: variables.length,
    });

  } catch (error) {
    console.error("Error fetching template variables:", error);
    return NextResponse.json(
      { error: "Failed to fetch template variables" },
      { status: 500 }
    );
  }
}

// POST /api/templates/variables - Create new template variable
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
    const validatedData = createVariableSchema.parse(body);

    // Check if variable key already exists for this organization
    const existingVariable = await db
      .select()
      .from(templateVariables)
      .where(
        and(
          eq(templateVariables.orgId, session.user.orgId),
          eq(templateVariables.variableKey, validatedData.variableKey)
        )
      )
      .limit(1);

    if (existingVariable.length > 0) {
      return NextResponse.json(
        { error: "Variable key already exists" },
        { status: 409 }
      );
    }

    const newVariable = await db
      .insert(templateVariables)
      .values({
        orgId: session.user.orgId,
        name: validatedData.name,
        description: validatedData.description,
        variableKey: validatedData.variableKey,
        defaultValue: validatedData.defaultValue,
        isCustom: true,
        isSystem: false,
        dataType: validatedData.dataType,
        createdBy: session.user.id,
      });

    return NextResponse.json(
      {
        message: "Template variable created successfully",
        variableId: newVariable.insertId,
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

    console.error("Error creating template variable:", error);
    return NextResponse.json(
      { error: "Failed to create template variable" },
      { status: 500 }
    );
  }
}

// Initialize system variables if they don't exist
export async function initializeSystemVariables(orgId: number): Promise<void> {
  const systemVariables = [
    {
      name: "First Name",
      variableKey: "firstName",
      description: "Client's first name",
      dataType: "string" as const,
    },
    {
      name: "Last Name", 
      variableKey: "lastName",
      description: "Client's last name",
      dataType: "string" as const,
    },
    {
      name: "Full Name",
      variableKey: "fullName", 
      description: "Client's full name",
      dataType: "string" as const,
    },
    {
      name: "Email",
      variableKey: "email",
      description: "Client's email address",
      dataType: "string" as const,
    },
    {
      name: "Phone",
      variableKey: "phone",
      description: "Client's primary phone number",
      dataType: "string" as const,
    },
    {
      name: "Appointment Type",
      variableKey: "appointmentType",
      description: "Type of appointment or service",
      dataType: "string" as const,
    },
    {
      name: "Appointment Date",
      variableKey: "appointmentDate",
      description: "Date of the appointment",
      dataType: "date" as const,
    },
    {
      name: "Appointment Time",
      variableKey: "appointmentTime",
      description: "Time of the appointment",
      dataType: "string" as const,
    },
    {
      name: "Next Appointment Date",
      variableKey: "nextAppointmentDate",
      description: "Date of the next scheduled appointment",
      dataType: "date" as const,
    },
    {
      name: "Staff Name",
      variableKey: "staffName",
      description: "Name of the staff member or provider",
      dataType: "string" as const,
    },
    {
      name: "Business Name",
      variableKey: "businessName",
      description: "Name of the business/organization",
      dataType: "string" as const,
    },
    {
      name: "Organization Name",
      variableKey: "orgName",
      description: "Organization name",
      dataType: "string" as const,
    },
    {
      name: "Organization Phone",
      variableKey: "orgPhone",
      description: "Organization's phone number",
      dataType: "string" as const,
    },
    {
      name: "Review Link",
      variableKey: "reviewLink",
      description: "Link to leave a review",
      dataType: "string" as const,
    },
    {
      name: "Unsubscribe Link",
      variableKey: "unsubscribeLink",
      description: "Link to unsubscribe from communications",
      dataType: "string" as const,
    },
  ];

  try {
    // Check if system variables already exist
    const existingSystemVars = await db
      .select()
      .from(templateVariables)
      .where(
        and(
          eq(templateVariables.orgId, orgId),
          eq(templateVariables.isSystem, true)
        )
      );

    // Only create missing system variables
    const existingKeys = existingSystemVars.map(v => v.variableKey);
    const missingVariables = systemVariables.filter(v => !existingKeys.includes(v.variableKey));

    if (missingVariables.length > 0) {
      await db.insert(templateVariables).values(
        missingVariables.map(variable => ({
          orgId,
          name: variable.name,
          description: variable.description,
          variableKey: variable.variableKey,
          defaultValue: "",
          isCustom: false,
          isSystem: true,
          dataType: variable.dataType,
          createdBy: null,
        }))
      );

      console.log(`Initialized ${missingVariables.length} system variables for org ${orgId}`);
    }
  } catch (error) {
    console.error("Error initializing system variables:", error);
    // Don't throw as this is a background operation
  }
}