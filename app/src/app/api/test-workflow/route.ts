import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { workflowId, testContactEmail, testContactPhone } = await request.json();

    console.log("🧪 Testing workflow:", workflowId);

    if (!workflowId) {
      return NextResponse.json(
        { success: false, error: "Workflow ID is required" },
        { status: 400 }
      );
    }

    // Call the Convex testWorkflow mutation
    const result = await convex.mutation(api.enhancedWorkflowEngine.testWorkflow, {
      workflowId,
      testContactEmail,
      testContactPhone,
    });

    // If the workflow test was successful, now actually send the messages
    if (result.success && result.results) {
      for (const stepResult of result.results) {
        if (stepResult.success && stepResult.result) {
          const { result: step } = stepResult;
          
          // Actually send SMS
          if (step.type === "sms") {
            try {
              const smsResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/send-sms`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  to: step.recipient,
                  body: step.content,
                }),
              });
              
              if (smsResponse.ok) {
                console.log(`📱 SMS sent successfully to ${step.recipient}`);
              } else {
                console.error(`📱 SMS failed to ${step.recipient}`);
              }
            } catch (error) {
              console.error("SMS sending error:", error);
            }
          }
          
          // Actually send Email
          if (step.type === "email") {
            try {
              const emailResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/send-email`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  to: step.recipient,
                  subject: step.subject,
                  body: step.body,
                }),
              });
              
              if (emailResponse.ok) {
                console.log(`📧 Email sent successfully to ${step.recipient}`);
              } else {
                console.error(`📧 Email failed to ${step.recipient}`);
              }
            } catch (error) {
              console.error("Email sending error:", error);
            }
          }
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Workflow test failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}