import { NextRequest, NextResponse } from "next/server";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

// Initialize AWS SNS client only if credentials are available
const snsClient = 
  process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? new SNSClient({
        region: process.env.AWS_REGION || "us-east-1",
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      })
    : null;

export async function POST(request: NextRequest) {
  try {
    const { to, body } = await request.json();

    // Validate required fields
    if (!to || !body) {
      return NextResponse.json(
        { error: "Missing required fields: to, body" },
        { status: 400 },
      );
    }

    if (!snsClient) {
      console.log("📱 No AWS credentials - using mock mode");
      console.log("📱 SMS Request:", {
        to,
        body,
        timestamp: new Date().toISOString(),
      });
      
      // Simulate SMS sending delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      return NextResponse.json({
        success: true,
        message: "Mock SMS sent successfully (no AWS credentials configured)",
        to,
      });
    }

    try {
      const command = new PublishCommand({
        PhoneNumber: to,
        Message: body,
      });

      const result = await snsClient.send(command);

      console.log("📱 SMS sent successfully:", {
        to,
        messageId: result.MessageId,
        body: body.substring(0, 50) + (body.length > 50 ? "..." : ""),
      });

      return NextResponse.json({
        success: true,
        message: "SMS sent successfully",
        messageId: result.MessageId,
        to,
      });
    } catch (awsError: any) {
      console.error("📱 AWS SNS error:", awsError);
      
      // Handle specific AWS errors
      if (awsError.name === "InvalidParameterException") {
        return NextResponse.json(
          { 
            error: "Invalid phone number format. Use international format like +1234567890",
            details: awsError.message,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { 
          error: "Failed to send SMS via AWS SNS",
          details: awsError.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("SMS API error:", error);
    return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 });
  }
}
