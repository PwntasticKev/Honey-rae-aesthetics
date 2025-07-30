import { NextRequest, NextResponse } from "next/server";

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

    // For development, we'll just log the SMS
    // In production, this would integrate with AWS SNS or similar
    console.log("📱 SMS Request:", {
      to,
      body,
      timestamp: new Date().toISOString(),
    });

    // Simulate SMS sending delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      message: "SMS sent successfully",
      to,
    });
  } catch (error) {
    console.error("SMS API error:", error);
    return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 });
  }
}
