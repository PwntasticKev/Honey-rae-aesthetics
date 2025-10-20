import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workflows } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);

  try {
    const [workflow] = await db
      .select()
      .from(workflows)
      .where(eq(workflows.id, id))
      .limit(1);

    if (!workflow) {
      return NextResponse.json({ message: "Workflow not found" }, { status: 404 });
    }

    return NextResponse.json({ workflow });
  } catch (error) {
    console.error(`Error fetching workflow with id ${id}:`, error);
    return NextResponse.json(
      { message: "Error fetching workflow" },
      { status: 500 }
    );
  }
}

const updateWorkflowSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional().nullable(),
  trigger: z.string().optional(),
  enabled: z.boolean().optional(),
  blocks: z.any().optional(),
  connections: z.any().optional(),
  flowData: z.string().optional(),
});


export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);

  try {
    const json = await request.json();
    const body = updateWorkflowSchema.parse(json);

    await db
      .update(workflows)
      .set(body)
      .where(eq(workflows.id, id));

    // For MySQL, we need to fetch the updated workflow
    const [updatedWorkflow] = await db
      .select()
      .from(workflows)
      .where(eq(workflows.id, id))
      .limit(1);

    if (!updatedWorkflow) {
      return NextResponse.json({ message: "Workflow not found" }, { status: 404 });
    }

    return NextResponse.json({ workflow: updatedWorkflow });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error(`Error updating workflow with id ${id}:`, error);
    return NextResponse.json(
      { message: "Error updating workflow" },
      { status: 500 }
    );
  }
}