import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sesService } from "@/lib/aws";
import { db } from "@/lib/db";
import { clients } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

// Schema for sending email
const sendEmailSchema = z.object({
  to: z.object({
    email: z.string().email("Valid email is required"),
    name: z.string().optional(),
  }),
  subject: z.string().min(1, "Subject is required"),
  htmlBody: z.string().optional(),
  textBody: z.string().optional(),
  templateName: z.string().optional(),
  templateData: z.record(z.any()).optional(),
  clientId: z.number().optional(),
  tags: z.record(z.string()).optional(),
});

// Schema for bulk email
const bulkEmailSchema = z.object({
  templateName: z.string().min(1, "Template name is required"),
  recipients: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
    templateData: z.record(z.any()).optional(),
  })).min(1, "At least one recipient is required"),
  tags: z.record(z.string()).optional(),
});

// POST /api/email/send - Send individual email
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
    const validatedData = sendEmailSchema.parse(body);

    // Verify client access if provided
    if (validatedData.clientId) {
      const client = await db
        .select()
        .from(clients)
        .where(
          and(
            eq(clients.id, validatedData.clientId),
            eq(clients.orgId, session.user.orgId)
          )
        )
        .limit(1);

      if (client.length === 0) {
        return NextResponse.json(
          { error: "Client not found or not accessible" },
          { status: 404 }
        );
      }
    }

    let result;

    if (validatedData.templateName) {
      // Send templated email
      result = await sesService.sendTemplatedEmail({
        to: validatedData.to,
        templateName: validatedData.templateName,
        templateData: validatedData.templateData || {},
        tags: {
          ...validatedData.tags,
          orgId: session.user.orgId.toString(),
          sentBy: session.user.id.toString(),
          ...(validatedData.clientId && { clientId: validatedData.clientId.toString() }),
        },
      });
    } else {
      // Send regular email
      if (!validatedData.htmlBody && !validatedData.textBody) {
        return NextResponse.json(
          { error: "Either htmlBody or textBody is required when not using a template" },
          { status: 400 }
        );
      }

      result = await sesService.sendEmail({
        to: validatedData.to,
        subject: validatedData.subject,
        htmlBody: validatedData.htmlBody,
        textBody: validatedData.textBody,
        tags: {
          ...validatedData.tags,
          orgId: session.user.orgId.toString(),
          sentBy: session.user.id.toString(),
          ...(validatedData.clientId && { clientId: validatedData.clientId.toString() }),
        },
      });
    }

    return NextResponse.json({
      message: "Email sent successfully",
      messageId: result.messageId,
      recipient: validatedData.to.email,
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email", details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/email/send - Send bulk emails
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = bulkEmailSchema.parse(body);

    // Send bulk templated email
    const result = await sesService.sendBulkTemplatedEmail({
      templateName: validatedData.templateName,
      recipients: validatedData.recipients.map(recipient => ({
        email: recipient.email,
        templateData: recipient.templateData || {},
      })),
      tags: {
        ...validatedData.tags,
        orgId: session.user.orgId.toString(),
        sentBy: session.user.id.toString(),
        bulk: "true",
      },
    });

    return NextResponse.json({
      message: "Bulk email sent successfully",
      messageId: result.messageId,
      recipientCount: validatedData.recipients.length,
      failedRecipients: result.failedRecipients || [],
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error sending bulk email:", error);
    return NextResponse.json(
      { error: "Failed to send bulk email", details: error.message },
      { status: 500 }
    );
  }
}