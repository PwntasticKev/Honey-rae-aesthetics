import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workflows } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const moveWorkflowSchema = z.object({
  directoryId: z.number().nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);

  try {
    const json = await request.json();
    const body = moveWorkflowSchema.parse(json);

    await db
      .update(workflows)
      .set({ directoryId: body.directoryId })
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

    return NextResponse.json({ 
      message: "Workflow moved successfully",
      workflow: updatedWorkflow 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error(`Error moving workflow with id ${id}:`, error);
    return NextResponse.json(
      { message: "Error moving workflow" },
      { status: 500 }
    );
  }
}