import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { workflows, executionLogs, workflowEnrollments, clients, appointments, users, socialPosts } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { z } from "zod";

// Schema for executing a workflow
const executeWorkflowSchema = z.object({
  workflowId: z.number(),
  triggeredBy: z.enum(["manual", "client_created", "appointment_scheduled", "appointment_completed", "file_uploaded", "schedule", "form_submitted"]),
  contextData: z.record(z.any()).optional(), // Data that triggered the workflow
  clientId: z.number().optional(),
  appointmentId: z.number().optional(),
});

// Schema for workflow execution status
const executionStatusSchema = z.object({
  executionId: z.number(),
});

// POST /api/workflows/execute - Execute a workflow
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
    const validatedData = executeWorkflowSchema.parse(body);

    // Get workflow details
    const workflow = await db
      .select()
      .from(workflows)
      .where(
        and(
          eq(workflows.id, validatedData.workflowId),
          eq(workflows.orgId, session.user.orgId)
        )
      )
      .limit(1);

    if (!workflow.length) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    if (!workflow[0].isActive) {
      return NextResponse.json(
        { error: "Workflow is not active" },
        { status: 400 }
      );
    }

    // Create workflow execution record
    const execution = await db.insert(executionLogs).values({
      orgId: session.user.orgId,
      workflowId: validatedData.workflowId,
      status: "pending",
      triggeredBy: validatedData.triggeredBy,
      contextData: validatedData.contextData || {},
      clientId: validatedData.clientId,
      appointmentId: validatedData.appointmentId,
      createdAt: new Date(),
      startedAt: new Date(),
    });

    const executionId = execution.insertId as number;

    // Start workflow execution in background
    executeWorkflowSteps(executionId, workflow[0], validatedData.contextData || {})
      .catch(async (error) => {
        console.error("Workflow execution failed:", error);
        await db
          .update(executionLogs)
          .set({
            status: "failed",
            errorMessage: error.message,
            completedAt: new Date(),
          })
          .where(eq(executionLogs.id, executionId));
      });

    return NextResponse.json({
      message: "Workflow execution started",
      executionId,
      status: "pending",
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error executing workflow:", error);
    return NextResponse.json(
      { error: "Failed to execute workflow" },
      { status: 500 }
    );
  }
}

// GET /api/workflows/execute?executionId=123 - Get execution status
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
    const executionId = searchParams.get('executionId');

    if (!executionId) {
      return NextResponse.json(
        { error: "Execution ID required" },
        { status: 400 }
      );
    }

    // Get execution details
    const execution = await db
      .select({
        id: executionLogs.id,
        workflowId: executionLogs.workflowId,
        workflowName: workflows.name,
        status: executionLogs.status,
        triggeredBy: executionLogs.triggeredBy,
        contextData: executionLogs.contextData,
        executionLog: executionLogs.executionLog,
        errorMessage: executionLogs.errorMessage,
        createdAt: executionLogs.createdAt,
        startedAt: executionLogs.startedAt,
        completedAt: executionLogs.completedAt,
      })
      .from(executionLogs)
      .leftJoin(workflows, eq(executionLogs.workflowId, workflows.id))
      .where(
        and(
          eq(executionLogs.id, parseInt(executionId)),
          eq(executionLogs.orgId, session.user.orgId)
        )
      )
      .limit(1);

    if (!execution.length) {
      return NextResponse.json(
        { error: "Execution not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      execution: execution[0],
    });

  } catch (error) {
    console.error("Error fetching execution status:", error);
    return NextResponse.json(
      { error: "Failed to fetch execution status" },
      { status: 500 }
    );
  }
}

// Main workflow execution function
async function executeWorkflowSteps(executionId: number, workflow: any, contextData: Record<string, any>) {
  try {
    // Update status to running
    await db
      .update(executionLogs)
      .set({
        status: "running",
        executionLog: [
          {
            step: "start",
            timestamp: new Date().toISOString(),
            message: "Workflow execution started",
          }
        ],
      })
      .where(eq(executionLogs.id, executionId));

    const steps = workflow.steps as any[];
    const executionLog: any[] = [];

    // Execute each step in sequence
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      try {
        // Check if step conditions are met
        if (step.conditions && step.conditions.length > 0) {
          const conditionsMet = await evaluateConditions(step.conditions, contextData);
          if (!conditionsMet) {
            executionLog.push({
              step: step.id,
              stepName: step.name,
              timestamp: new Date().toISOString(),
              status: "skipped",
              message: "Step conditions not met",
            });
            continue;
          }
        }

        // Apply delay if specified
        if (step.delay && step.delay > 0) {
          await new Promise(resolve => setTimeout(resolve, step.delay * 60 * 1000)); // Convert minutes to milliseconds
        }

        // Execute the step
        const stepResult = await executeStep(step, contextData, workflow.orgId);
        
        executionLog.push({
          step: step.id,
          stepName: step.name,
          timestamp: new Date().toISOString(),
          status: "completed",
          message: stepResult.message,
          result: stepResult.data,
        });

        // Update context data with step results
        if (stepResult.data) {
          Object.assign(contextData, stepResult.data);
        }

      } catch (stepError: any) {
        executionLog.push({
          step: step.id,
          stepName: step.name,
          timestamp: new Date().toISOString(),
          status: "failed",
          message: stepError.message,
          error: stepError.toString(),
        });

        // Update execution with error
        await db
          .update(executionLogs)
          .set({
            status: "failed",
            errorMessage: `Step ${step.name} failed: ${stepError.message}`,
            executionLog,
            completedAt: new Date(),
          })
          .where(eq(executionLogs.id, executionId));

        return;
      }
    }

    // Workflow completed successfully
    await db
      .update(executionLogs)
      .set({
        status: "completed",
        executionLog,
        completedAt: new Date(),
      })
      .where(eq(executionLogs.id, executionId));

  } catch (error: any) {
    console.error("Workflow execution error:", error);
    await db
      .update(executionLogs)
      .set({
        status: "failed",
        errorMessage: error.message,
        completedAt: new Date(),
      })
      .where(eq(executionLogs.id, executionId));
  }
}

// Execute individual step
async function executeStep(step: any, contextData: Record<string, any>, orgId: number): Promise<{ message: string; data?: Record<string, any> }> {
  switch (step.type) {
    case "send_email":
      return await executeEmailStep(step, contextData, orgId);
    
    case "send_sms":
      return await executeSmsStep(step, contextData, orgId);
    
    case "create_appointment":
      return await executeCreateAppointmentStep(step, contextData, orgId);
    
    case "update_client":
      return await executeUpdateClientStep(step, contextData, orgId);
    
    case "create_task":
      return await executeCreateTaskStep(step, contextData, orgId);
    
    case "send_notification":
      return await executeSendNotificationStep(step, contextData, orgId);
    
    case "post_social":
      return await executePostSocialStep(step, contextData, orgId);
    
    case "wait":
      return await executeWaitStep(step, contextData, orgId);
    
    case "condition":
      return await executeConditionStep(step, contextData, orgId);
    
    default:
      throw new Error(`Unknown step type: ${step.type}`);
  }
}

// Step execution functions
async function executeEmailStep(step: any, contextData: Record<string, any>, orgId: number) {
  // TODO: Integrate with email service (AWS SES)
  // For now, simulate email sending
  const { to, subject, body, template } = step.config;
  
  return {
    message: `Email sent to ${to || contextData.email || 'recipient'}`,
    data: { emailSent: true, subject }
  };
}

async function executeSmsStep(step: any, contextData: Record<string, any>, orgId: number) {
  // TODO: Integrate with SMS service (AWS SNS)
  // For now, simulate SMS sending
  const { to, message, template } = step.config;
  
  return {
    message: `SMS sent to ${to || contextData.phone || 'recipient'}`,
    data: { smsSent: true, message }
  };
}

async function executeCreateAppointmentStep(step: any, contextData: Record<string, any>, orgId: number) {
  const { service, duration, clientId, date } = step.config;
  
  // Create appointment
  const appointment = await db.insert(appointments).values({
    orgId,
    clientId: clientId || contextData.clientId,
    title: service,
    description: `Auto-created appointment: ${service}`,
    startTime: new Date(date || Date.now() + 24 * 60 * 60 * 1000), // Default to tomorrow
    duration: duration || 60,
    status: "scheduled",
    createdAt: new Date(),
  });

  return {
    message: `Appointment created for ${service}`,
    data: { appointmentId: appointment.insertId, service }
  };
}

async function executeUpdateClientStep(step: any, contextData: Record<string, any>, orgId: number) {
  const { field, value, clientId } = step.config;
  const targetClientId = clientId || contextData.clientId;

  if (!targetClientId) {
    throw new Error("No client ID provided for update");
  }

  // Update client field
  const updateData: any = {};
  updateData[field] = value;
  updateData.updatedAt = new Date();

  await db
    .update(clients)
    .set(updateData)
    .where(and(
      eq(clients.id, targetClientId),
      eq(clients.orgId, orgId)
    ));

  return {
    message: `Client ${field} updated to ${value}`,
    data: { clientUpdated: true, field, value }
  };
}

async function executeCreateTaskStep(step: any, contextData: Record<string, any>, orgId: number) {
  // TODO: Integrate with task management system
  const { title, description, assignedTo, dueDate } = step.config;
  
  return {
    message: `Task created: ${title}`,
    data: { taskCreated: true, title }
  };
}

async function executeSendNotificationStep(step: any, contextData: Record<string, any>, orgId: number) {
  // TODO: Integrate with notification system
  const { message, type, userId } = step.config;
  
  return {
    message: `Notification sent: ${message}`,
    data: { notificationSent: true, type }
  };
}

async function executePostSocialStep(step: any, contextData: Record<string, any>, orgId: number) {
  const { platforms, content, mediaUrls } = step.config;
  
  // Create social media post
  const post = await db.insert(socialPosts).values({
    orgId,
    title: "Auto-generated post",
    content,
    mediaUrls: mediaUrls || [],
    platforms,
    status: "published",
    scheduledAt: new Date(),
    publishedAt: new Date(),
    createdBy: 1, // System user
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return {
    message: `Social media post created for platforms: ${platforms.join(', ')}`,
    data: { postId: post.insertId, platforms }
  };
}

async function executeWaitStep(step: any, contextData: Record<string, any>, orgId: number) {
  const { duration } = step.config; // Duration in minutes
  
  // Wait is handled by the delay mechanism in executeWorkflowSteps
  return {
    message: `Waited for ${duration} minutes`,
    data: { waitTime: duration }
  };
}

async function executeConditionStep(step: any, contextData: Record<string, any>, orgId: number) {
  const { conditions, trueAction, falseAction } = step.config;
  
  const conditionsMet = await evaluateConditions(conditions, contextData);
  
  return {
    message: `Condition evaluated: ${conditionsMet ? 'true' : 'false'}`,
    data: { conditionResult: conditionsMet }
  };
}

// Evaluate conditions
async function evaluateConditions(conditions: any[], contextData: Record<string, any>): Promise<boolean> {
  for (const condition of conditions) {
    const { field, operator, value } = condition;
    const fieldValue = contextData[field];

    switch (operator) {
      case "equals":
        if (fieldValue !== value) return false;
        break;
      case "not_equals":
        if (fieldValue === value) return false;
        break;
      case "contains":
        if (!String(fieldValue).includes(String(value))) return false;
        break;
      case "not_contains":
        if (String(fieldValue).includes(String(value))) return false;
        break;
      case "greater_than":
        if (Number(fieldValue) <= Number(value)) return false;
        break;
      case "less_than":
        if (Number(fieldValue) >= Number(value)) return false;
        break;
      case "is_empty":
        if (fieldValue) return false;
        break;
      case "is_not_empty":
        if (!fieldValue) return false;
        break;
    }
  }
  
  return true;
}