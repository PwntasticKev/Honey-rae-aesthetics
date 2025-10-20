import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { workflows } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/workflows-test/[id]/test-realtime - Execute workflow with real-time SSE updates
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = parseInt(params.id);
    
    if (isNaN(workflowId)) {
      return new Response("Invalid workflow ID", { status: 400 });
    }

    const body = await request.json();
    const testData = body.testData || {};

    // Get workflow
    const workflow = await db
      .select()
      .from(workflows)
      .where(eq(workflows.id, workflowId))
      .limit(1);

    if (!workflow.length) {
      return new Response("Workflow not found", { status: 404 });
    }

    const workflowData = workflow[0];

    // Create readable stream for Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        // Send initial connection message
        const sessionId = `test-${workflowId}-${Date.now()}`;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'connected',
          sessionId,
          workflow: {
            id: workflowData.id,
            name: workflowData.name,
            description: workflowData.description
          }
        })}\n\n`));

        try {
          // Execute workflow with real-time updates
          await executeWorkflowRealtime(workflowData, testData, controller, encoder);
          
          // Send completion message
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'completed',
            message: 'Workflow test completed successfully'
          })}\n\n`));
          
        } catch (error) {
          // Send error message
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: 'Workflow test failed',
            error: String(error)
          })}\n\n`));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error("Error in real-time workflow test:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

// Execute workflow with real-time step-by-step updates via SSE
async function executeWorkflowRealtime(
  workflow: any,
  testData: any,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  const blocks = workflow.blocks || [];
  const connections = workflow.connections || [];
  
  if (!blocks.length) {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
      type: 'error',
      message: 'No blocks found in workflow'
    })}\n\n`));
    return;
  }

  // Send workflow start message
  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
    type: 'workflow_started',
    workflowId: workflow.id,
    workflowName: workflow.name,
    totalSteps: blocks.length,
    startTime: Date.now()
  })}\n\n`));

  // Find starting node
  const startNode = blocks.find((block: any) => 
    block.type === "trigger" || block.data?.type === "trigger"
  );

  if (!startNode) {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
      type: 'error',
      message: 'No trigger node found in workflow'
    })}\n\n`));
    return;
  }

  // Build execution plan
  const executionPlan = buildExecutionPlan(startNode, blocks, connections);
  
  // Send execution plan
  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
    type: 'execution_plan',
    steps: executionPlan.map((node, index) => ({
      stepNumber: index + 1,
      nodeId: node.id,
      nodeName: node.data?.label || node.type,
      nodeType: node.data?.type || node.type
    }))
  })}\n\n`));

  // Execute each step with real-time updates
  for (let i = 0; i < executionPlan.length; i++) {
    const node = executionPlan[i];
    const stepNumber = i + 1;
    
    // Send step start
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
      type: 'step_started',
      stepNumber,
      nodeId: node.id,
      nodeName: node.data?.label || node.type,
      nodeType: node.data?.type || node.type,
      startTime: Date.now()
    })}\n\n`));

    // Simulate step execution with progress updates
    const stepResult = await executeStepWithProgress(node, testData, controller, encoder, stepNumber);
    
    // Send step completion
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
      type: 'step_completed',
      stepNumber,
      nodeId: node.id,
      nodeName: node.data?.label || node.type,
      nodeType: node.data?.type || node.type,
      status: stepResult.success ? 'success' : 'failed',
      message: stepResult.message,
      details: stepResult.details,
      endTime: Date.now()
    })}\n\n`));

    // If step failed, stop execution
    if (!stepResult.success) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        type: 'workflow_failed',
        failedAt: stepNumber,
        reason: stepResult.message
      })}\n\n`));
      return;
    }

    // Small delay between steps
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

// Execute individual step with progress updates
async function executeStepWithProgress(
  node: any,
  testData: any,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  stepNumber: number
) {
  const nodeType = node.data?.type || node.type;
  const nodeConfig = node.data?.config || {};
  
  // Send progress updates during execution
  const progressSteps = ['Initializing', 'Processing', 'Executing', 'Completing'];
  
  for (let i = 0; i < progressSteps.length; i++) {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
      type: 'step_progress',
      stepNumber,
      nodeId: node.id,
      progress: Math.round(((i + 1) / progressSteps.length) * 100),
      status: progressSteps[i]
    })}\n\n`));
    
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
  }
  
  // Execute based on node type
  switch (nodeType) {
    case "trigger":
      return {
        success: true,
        message: "✅ Workflow triggered successfully",
        details: {
          triggerType: nodeConfig.triggerType || "manual",
          timestamp: new Date().toISOString(),
        }
      };
      
    case "email":
      return {
        success: true,
        message: `📧 [TEST] Email sent: "${nodeConfig.subject || 'Test Email'}"`,
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
        message: `📱 [TEST] SMS sent: "${nodeConfig.message || 'Test message'}"`,
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
        message: `⏱️ [TEST] Delay simulated: ${nodeConfig.duration || 1} ${nodeConfig.unit || 'hours'}`,
        details: {
          originalDelay: `${nodeConfig.duration || 1} ${nodeConfig.unit || 'hours'}`,
          simulatedDelay: "Instant (for testing)",
          testMode: true,
        }
      };
      
    case "condition":
      const conditionMet = Math.random() > 0.2; // 80% success rate
      return {
        success: conditionMet,
        message: conditionMet 
          ? "✅ [TEST] Condition met, continuing workflow" 
          : "❌ [TEST] Condition not met, workflow stopped",
        details: {
          conditions: nodeConfig.conditions || [],
          result: conditionMet,
          testMode: true,
        }
      };
      
    default:
      return {
        success: true,
        message: `⚡ [TEST] ${node.data?.label || 'Action'} executed successfully`,
        details: {
          nodeType,
          testMode: true,
        }
      };
  }
}

// Build execution plan by following connections
function buildExecutionPlan(startNode: any, blocks: any[], connections: any[]) {
  const plan = [startNode];
  const visited = new Set([startNode.id]);
  
  let currentNode = startNode;
  
  while (currentNode) {
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