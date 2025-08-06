import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    const { to, subject, body, orgId, clientId } = await request.json();

    if (!to || !body) {
      return NextResponse.json(
        { error: "Missing required fields: to, body" },
        { status: 400 },
      );
    }

    if (!resend) {
      console.log("📧 No Resend API key - using mock mode");
      await new Promise((resolve) => setTimeout(resolve, 500));
      return NextResponse.json({
        success: true,
        message: "Mock email sent successfully (no API key configured)",
        to,
        subject: subject || "Workflow Test Email",
      });
    }

    const { data, error } = await resend.emails.send({
      from: "Honey Rae <noreply@honeyraeaesthetics.com>",
      to: [to],
      subject: subject || "Workflow Test Email",
      html: body.replace(/\n/g, "<br>"),
    });

    if (error) {
      console.error("📧 Resend error:", error);

      // Handle domain verification errors
      if (
        (error as any).statusCode === 403 &&
        (error as any).error?.includes("domain")
      ) {
        return NextResponse.json(
          {
            error:
              "Domain not verified. Please verify honeyraeaesthetics.com on Resend or use pwntastickevin@gmail.com for testing.",
            details: (error as any).error,
          },
          { status: 500 },
        );
      }

      return NextResponse.json(
        { error: `Failed to send email: ${error.message}` },
        { status: 500 },
      );
    }

    console.log("📧 Email sent via Resend:", {
      to,
      subject: subject || "Workflow Test Email",
      messageId: data?.id,
    });

    return NextResponse.json({
      success: true,
      message: "Email sent successfully via Resend",
      to,
      subject: subject || "Workflow Test Email",
      messageId: data?.id,
    });
  } catch (error) {
    console.error("📧 Email API error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
