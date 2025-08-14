import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { workflowData, testContactEmail, testContactPhone } = await request.json();

    console.log("🧪 Testing workflow:", workflowData.name);

    // Mock test results for now - in production this would integrate with Convex
    const results = [];
    let successfulSteps = 0;

    // Test each block in the workflow
    for (const block of workflowData.blocks || []) {
      if (block.type === "trigger") continue; // Skip trigger blocks

      try {
        let stepResult = null;

        switch (block.type) {
          case "send_sms":
            stepResult = await testSMSStep(block.config, testContactPhone);
            break;
          case "send_email":
            stepResult = await testEmailStep(block.config, testContactEmail);
            break;
          case "add_tag":
            stepResult = { action: "add_tag", tag: block.config.tag, simulated: true };
            break;
          case "remove_tag":
            stepResult = {
              action: "remove_tag",
              tag: block.config.tag,
              removeAll: block.config.removeAll,
              simulated: true,
            };
            break;
          case "delay":
            stepResult = {
              action: "delay",
              value: block.config.value,
              unit: block.config.unit,
              simulated: true,
            };
            break;
          case "if":
            stepResult = {
              action: "condition",
              field: block.config.field,
              operator: block.config.operator,
              value: block.config.value,
              simulated: true,
            };
            break;
          default:
            stepResult = { action: block.type, simulated: true };
        }

        results.push({
          blockId: block.id,
          blockType: block.type,
          success: true,
          result: stepResult,
        });

        successfulSteps++;
      } catch (error) {
        results.push({
          blockId: block.id,
          blockType: block.type,
          success: false,
          error: String(error),
        });
      }
    }

    return NextResponse.json({
      success: true,
      workflowName: workflowData.name,
      testContact: {
        email: testContactEmail,
        phone: testContactPhone,
      },
      results,
      totalSteps: results.length,
      successfulSteps,
    });
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

// Test SMS step with variable substitution
async function testSMSStep(config: any, testPhone: string) {
  const message = substituteTestVariables(config.message || "Test SMS message");

  console.log(`🧪📱 TEST SMS to ${testPhone}: ${message}`);

  // Here you would integrate with your actual SMS service
  // For now, we'll simulate success

  return {
    type: "sms",
    recipient: testPhone,
    content: message,
    sent: true,
    testMode: true,
  };
}

// Test Email step with variable substitution
async function testEmailStep(config: any, testEmail: string) {
  const subject = substituteTestVariables(config.subject || "Test Email Subject");
  const body = substituteTestVariables(
    config.body || "This is a test email from your workflow."
  );

  console.log(`🧪📧 TEST EMAIL to ${testEmail}:`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${body}`);

  // Here you would integrate with your actual email service
  // For now, we'll simulate success

  return {
    type: "email",
    recipient: testEmail,
    subject,
    body,
    sent: true,
    testMode: true,
  };
}

// Substitute variables with test data
function substituteTestVariables(text: string): string {
  if (!text) return "";

  let result = text;

  // Client test data
  result = result.replace(/\{\{first_name\}\}/g, "Kevin");
  result = result.replace(/\{\{last_name\}\}/g, "Lee");
  result = result.replace(/\{\{client_name\}\}/g, "Kevin Lee");
  result = result.replace(/\{\{phone\}\}/g, "+18018850601");
  result = result.replace(/\{\{email\}\}/g, "pwntastickevin@gmail.com");

  // Appointment test data
  const testDate = new Date();
  result = result.replace(/\{\{appointment_date\}\}/g, testDate.toLocaleDateString());
  result = result.replace(
    /\{\{appointment_time\}\}/g,
    testDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
  result = result.replace(/\{\{appointment_type\}\}/g, "Morpheus8 Treatment");
  result = result.replace(/\{\{provider\}\}/g, "Dr. Smith");

  // Business test data
  result = result.replace(/\{\{business_name\}\}/g, "Honey Rae Aesthetics");
  result = result.replace(/\{\{business_phone\}\}/g, "(555) 123-4567");
  result = result.replace(/\{\{business_email\}\}/g, "info@honeyraeaesthetics.com");
  result = result.replace(
    /\{\{google_review_link\}\}/g,
    "https://g.page/r/TestBusinessReviewLink"
  );
  result = result.replace(
    /\{\{booking_link\}\}/g,
    "https://book.honeyraeaesthetics.com"
  );
  result = result.replace(/\{\{website_url\}\}/g, "https://honeyraeaesthetics.com");

  return result;
}