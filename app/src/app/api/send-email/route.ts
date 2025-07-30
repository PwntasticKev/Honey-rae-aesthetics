import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { to, subject, body } = await request.json();

    // Validate required fields
    if (!to || !body) {
      return NextResponse.json(
        { error: "Missing required fields: to, body" },
        { status: 400 },
      );
    }

    // For development, we'll just log the email
    // In production, this would integrate with AWS SES or similar
    console.log("📧 Email Request:", {
      to,
      subject: subject || "Workflow Test Email",
      body,
      timestamp: new Date().toISOString(),
    });

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
      to,
      subject: subject || "Workflow Test Email",
    });
  } catch (error) {
    console.error("Email API error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
