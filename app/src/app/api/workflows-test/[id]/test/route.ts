import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workflows } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Schema for workflow test request
const testWorkflowSchema = z.object({
  testData: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    clientData: z.any().optional(),
  }),
  mode: z.enum(["test", "preview"]).default("test"),
});

// POST /api/workflows-test/[id]/test - Execute workflow test
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = parseInt(params.id);
    
    if (isNaN(workflowId)) {
      return NextResponse.json(
        { error: "Invalid workflow ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = testWorkflowSchema.parse(body);

    // Get workflow
    const workflow = await db
      .select()
      .from(workflows)
      .where(eq(workflows.id, workflowId))
      .limit(1);

    if (!workflow.length) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    const workflowData = workflow[0];

    // Create test execution session
    const testSessionId = `test-${workflowId}-${Date.now()}`;
    
    // Start workflow execution simulation
    const executionResult = await simulateWorkflowExecution(
      workflowData,
      validatedData.testData,
      testSessionId
    );

    return NextResponse.json({
      message: "Workflow test started",
      sessionId: testSessionId,
      execution: executionResult,
      workflow: {
        id: workflowData.id,
        name: workflowData.name,
        blocks: workflowData.blocks,
        connections: workflowData.connections,
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error testing workflow:", error);
    return NextResponse.json(
      { error: "Failed to test workflow" },
      { status: 500 }
    );
  }
}

// Simulate workflow execution with step-by-step progress
async function simulateWorkflowExecution(
  workflow: any,
  testData: any,
  sessionId: string
) {
  const blocks = workflow.blocks || [];
  const connections = workflow.connections || [];
  
  if (!blocks.length) {
    return {
      status: "completed",
      steps: [],
      message: "No blocks to execute"
    };
  }

  // Find starting node (trigger)
  const startNode = blocks.find((block: any) => 
    block.type === "trigger" || block.data?.type === "trigger"
  );

  if (!startNode) {
    return {
      status: "error",
      steps: [],
      message: "No trigger node found"
    };
  }

  // Build execution plan by following connections
  const executionPlan = buildExecutionPlan(startNode, blocks, connections);
  
  // Execute workflow simulation
  const steps = [];
  const startTime = Date.now();

  for (let i = 0; i < executionPlan.length; i++) {
    const node = executionPlan[i];
    const stepStartTime = Date.now();
    
    // Simulate step execution
    const stepResult = await simulateNodeExecution(node, testData);
    
    const step = {
      stepNumber: i + 1,
      nodeId: node.id,
      nodeName: node.data?.label || node.type,
      nodeType: node.data?.type || node.type,
      status: stepResult.success ? "completed" : "failed",
      startTime: stepStartTime,
      endTime: Date.now(),
      duration: Date.now() - stepStartTime,
      message: stepResult.message,
      details: stepResult.details,
      testMode: true,
    };

    steps.push(step);

    // If step failed, stop execution
    if (!stepResult.success) {
      break;
    }
  }

  return {
    status: steps.every(s => s.status === "completed") ? "completed" : "failed",
    sessionId,
    workflowId: workflow.id,
    workflowName: workflow.name,
    startTime,
    endTime: Date.now(),
    totalDuration: Date.now() - startTime,
    steps,
    testData,
  };
}

// Build execution plan by following node connections
function buildExecutionPlan(startNode: any, blocks: any[], connections: any[]) {
  const plan = [startNode];
  const visited = new Set([startNode.id]);
  
  let currentNode = startNode;
  
  while (currentNode) {
    // Find next node
    const connection = connections.find(conn => conn.source === currentNode.id);
    
    if (!connection) break;
    
    const nextNode = blocks.find(block => block.id === connection.target);
    
    if (!nextNode || visited.has(nextNode.id)) break;
    
    plan.push(nextNode);
    visited.add(nextNode.id);
    currentNode = nextNode;
  }
  
  return plan;
}

// Simulate execution of individual workflow nodes
async function simulateNodeExecution(node: any, testData: any) {
  const nodeType = node.data?.type || node.type;
  const nodeConfig = node.data?.config || {};
  
  // Add small delay to simulate real execution
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  
  switch (nodeType) {
    case "trigger":
      return {
        success: true,
        message: "Workflow triggered successfully",
        details: {
          triggerType: nodeConfig.triggerType || "manual",
          timestamp: new Date().toISOString(),
        }
      };
      
    case "email":
      return {
        success: true,
        message: `[TEST] Email sent: "${nodeConfig.subject || 'Test Email'}"`,
        details: {
          to: testData.email || "test@example.com",
          subject: nodeConfig.subject || "Test Email",
          template: nodeConfig.template || "default",
          testMode: true,
          actualEmailSent: false,
        }
      };
      
    case "sms":
      return {
        success: true,
        message: `[TEST] SMS sent: "${nodeConfig.message || 'Test message'}"`,
        details: {
          to: testData.phone || "+1234567890",
          message: nodeConfig.message || "Test SMS message",
          testMode: true,
          actualSmsSent: false,
        }
      };
      
    case "delay":
      return {
        success: true,
        message: `[TEST] Delay simulated: ${nodeConfig.duration || 1} ${nodeConfig.unit || 'hours'}`,
        details: {
          originalDelay: `${nodeConfig.duration || 1} ${nodeConfig.unit || 'hours'}`,
          simulatedDelay: "1 second (for testing)",
          testMode: true,
        }
      };
      
    case "condition":
      // Simulate condition evaluation
      const conditionMet = Math.random() > 0.3; // 70% success rate for testing
      return {
        success: conditionMet,
        message: conditionMet 
          ? "[TEST] Condition met, continuing workflow" 
          : "[TEST] Condition not met, workflow stopped",
        details: {
          conditions: nodeConfig.conditions || [],
          result: conditionMet,
          testMode: true,
        }
      };
      
    case "action":
      return {
        success: true,
        message: `[TEST] Action executed: ${node.data?.label || 'Custom action'}`,
        details: {
          actionType: nodeConfig.actionType || "custom",
          testMode: true,
        }
      };
      
    default:
      return {
        success: true,
        message: `[TEST] Unknown node type "${nodeType}" - simulated as successful`,
        details: {
          nodeType,
          testMode: true,
        }
      };
  }
}