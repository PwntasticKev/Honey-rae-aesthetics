import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workflows } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Mock templates data - in a real app, this would come from a database
const mockTemplates = [
  {
    id: "template-1",
    name: "New Client Welcome",
    description: "A simple workflow to welcome new clients with an email and a follow-up SMS.",
    blocks: [
      { id: "1", type: "trigger", position: { x: 250, y: 50 }, data: { label: "Client Created" } },
      { id: "2", type: "action", position: { x: 250, y: 200 }, data: { label: "Send Welcome Email" } },
      { id: "3", type: "delay", position: { x: 250, y: 350 }, data: { label: "Wait 1 Day" } },
      { id: "4", type: "action", position: { x: 250, y: 500 }, data: { label: "Send Follow-up SMS" } },
    ],
    connections: [
      { id: "e1-2", source: "1", target: "2" },
      { id: "e2-3", source: "2", target: "3" },
      { id: "e3-4", source: "3", target: "4" },
    ],
  },
    {
    id: "template-2",
    name: "Post-Appointment Review Request",
    description: "Ask for a Google review 15 minutes after an appointment is completed.",
    blocks: [
        { id: "1", type: "trigger", position: { x: 250, y: 50 }, data: { label: "Appointment Completed" } },
        { id: "2", type: "delay", position: { x: 250, y: 200 }, data: { label: "Wait 15 Minutes" } },
        { id: "3", type: "action", position: { x: 250, y: 350 }, data: { label: "Send Review Request SMS" } },
    ],
    connections: [
        { id: "e1-2", source: "1", target: "2" },
        { id: "e2-3", source: "2", target: "3" },
    ]
  },
];


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // In a real app, you'd get the orgId from the authenticated user's session
    const orgId = Number(searchParams.get('orgId')) || 15; // Default to test org

    const allWorkflows = await db
      .select()
      .from(workflows)
      .where(eq(workflows.orgId, orgId));

    return NextResponse.json({ workflows: allWorkflows });
  } catch (error) {
    console.error("Error fetching workflows:", error);
    return NextResponse.json(
      { message: "Error fetching workflows" },
      { status: 500 }
    );
  }
}

const createWorkflowSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  orgId: z.number(),
  templateId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = createWorkflowSchema.parse(json);

    let workflowData: Partial<typeof workflows.$inferInsert> = {
      orgId: body.orgId,
      trigger: "manual",
      enabled: false,
      runCount: 0,
    };

    if (body.templateId) {
      const template = mockTemplates.find(t => t.id === body.templateId);
      if (!template) {
        return NextResponse.json({ message: "Template not found" }, { status: 404 });
      }
      workflowData = {
        ...workflowData,
        name: template.name,
        description: template.description || "",
        blocks: template.blocks as any,
        connections: template.connections as any,
      };
    } else {
      if (!body.name) {
        return NextResponse.json({ message: "Name is required for non-template workflows" }, { status: 400 });
      }
      workflowData = {
        ...workflowData,
        name: body.name,
        description: body.description || "",
      };
    }

    const result = await db
      .insert(workflows)
      .values(workflowData);

    // For MySQL, we need to fetch the created workflow by insertId
    const [newWorkflow] = await db
      .select()
      .from(workflows)
      .where(eq(workflows.id, result.insertId as number))
      .limit(1);

    return NextResponse.json({ workflow: newWorkflow }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error creating workflow:", error);
    return NextResponse.json(
      { message: "Error creating workflow" },
      { status: 500 }
    );
  }
}