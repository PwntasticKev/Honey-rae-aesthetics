import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { snsService } from "@/lib/aws";
import { db } from "@/lib/db";
import { clients } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

// Schema for sending SMS
const sendSMSSchema = z.object({
  phoneNumber: z.string().min(10, "Valid phone number is required"),
  message: z.string().min(1, "Message is required").max(1600, "Message too long"),
  messageType: z.enum(["Promotional", "Transactional"]).optional().default("Transactional"),
  clientId: z.number().optional(),
  templateType: z.enum([
    "appointment_reminder",
    "appointment_confirmation", 
    "welcome",
    "birthday",
    "follow_up",
    "custom"
  ]).optional().default("custom"),
  templateData: z.record(z.any()).optional(),
});

// Schema for bulk SMS
const bulkSMSSchema = z.object({
  recipients: z.array(z.object({
    phoneNumber: z.string().min(10),
    message: z.string().min(1).max(1600),
    clientId: z.number().optional(),
  })).min(1, "At least one recipient is required").max(100, "Maximum 100 recipients per batch"),
  messageType: z.enum(["Promotional", "Transactional"]).optional().default("Promotional"),
});

// POST /api/sms/send - Send individual SMS
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
    const validatedData = sendSMSSchema.parse(body);

    // Verify client access if provided
    let client = null;
    if (validatedData.clientId) {
      const clientResult = await db
        .select()
        .from(clients)
        .where(
          and(
            eq(clients.id, validatedData.clientId),
            eq(clients.orgId, session.user.orgId)
          )
        )
        .limit(1);

      if (clientResult.length === 0) {
        return NextResponse.json(
          { error: "Client not found or not accessible" },
          { status: 404 }
        );
      }
      client = clientResult[0];
    }

    let message = validatedData.message;
    
    // Use predefined templates if specified
    if (validatedData.templateType !== "custom" && client) {
      const templateData = {
        clientName: client.firstName || "there",
        firstName: client.firstName || "there",
        ...validatedData.templateData,
      };

      switch (validatedData.templateType) {
        case "appointment_reminder":
          const result = await snsService.sendAppointmentReminder(
            validatedData.phoneNumber,
            templateData
          );
          return NextResponse.json({
            message: "Appointment reminder SMS sent successfully",
            messageId: result.messageId,
            phoneNumber: validatedData.phoneNumber,
          });

        case "appointment_confirmation":
          const confirmResult = await snsService.sendAppointmentConfirmation(
            validatedData.phoneNumber,
            templateData
          );
          return NextResponse.json({
            message: "Appointment confirmation SMS sent successfully",
            messageId: confirmResult.messageId,
            phoneNumber: validatedData.phoneNumber,
          });

        case "welcome":
          const welcomeResult = await snsService.sendWelcomeSMS(
            validatedData.phoneNumber,
            templateData
          );
          return NextResponse.json({
            message: "Welcome SMS sent successfully",
            messageId: welcomeResult.messageId,
            phoneNumber: validatedData.phoneNumber,
          });

        case "birthday":
          const birthdayResult = await snsService.sendBirthdaySMS(
            validatedData.phoneNumber,
            templateData
          );
          return NextResponse.json({
            message: "Birthday SMS sent successfully",
            messageId: birthdayResult.messageId,
            phoneNumber: validatedData.phoneNumber,
          });

        case "follow_up":
          const followUpResult = await snsService.sendFollowUpSMS(
            validatedData.phoneNumber,
            templateData
          );
          return NextResponse.json({
            message: "Follow-up SMS sent successfully",
            messageId: followUpResult.messageId,
            phoneNumber: validatedData.phoneNumber,
          });
      }
    }

    // Send custom SMS
    const result = await snsService.sendSMS({
      phoneNumber: validatedData.phoneNumber,
      message: message,
      messageType: validatedData.messageType,
    });

    return NextResponse.json({
      message: "SMS sent successfully",
      messageId: result.messageId,
      phoneNumber: validatedData.phoneNumber,
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error sending SMS:", error);
    return NextResponse.json(
      { error: "Failed to send SMS", details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/sms/send - Send bulk SMS
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
    const validatedData = bulkSMSSchema.parse(body);

    // Verify all client IDs if provided
    const clientIds = validatedData.recipients
      .map(r => r.clientId)
      .filter(Boolean) as number[];

    if (clientIds.length > 0) {
      const clientResults = await db
        .select({ id: clients.id })
        .from(clients)
        .where(
          and(
            eq(clients.orgId, session.user.orgId)
            // Note: We would need to use an IN clause here for multiple client IDs
          )
        );

      const validClientIds = clientResults.map(c => c.id);
      const invalidClientIds = clientIds.filter(id => !validClientIds.includes(id));

      if (invalidClientIds.length > 0) {
        return NextResponse.json(
          { error: `Invalid client IDs: ${invalidClientIds.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Send bulk SMS
    const result = await snsService.sendBulkSMS({
      recipients: validatedData.recipients,
      messageType: validatedData.messageType,
    });

    return NextResponse.json({
      message: "Bulk SMS sent successfully",
      totalRecipients: validatedData.recipients.length,
      successful: result.successful,
      failed: result.failed,
      failedNumbers: result.failedNumbers,
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error sending bulk SMS:", error);
    return NextResponse.json(
      { error: "Failed to send bulk SMS", details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/sms/send - Get SMS configuration and limits
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get current SMS attributes
    const smsAttributes = await snsService.getSMSAttributes();

    return NextResponse.json({
      limits: {
        maxMessageLength: 1600,
        maxRecipientsPerBatch: 100,
        monthlySpendLimit: smsAttributes.MonthlySpendLimit || "1.00",
        defaultMessageType: smsAttributes.DefaultSMSType || "Transactional",
      },
      templates: [
        {
          type: "appointment_reminder",
          name: "Appointment Reminder",
          description: "Remind clients about upcoming appointments",
          variables: ["clientName", "service", "time", "clinicPhone"],
        },
        {
          type: "appointment_confirmation",
          name: "Appointment Confirmation",
          description: "Confirm scheduled appointments",
          variables: ["service", "date", "time", "address"],
        },
        {
          type: "welcome",
          name: "Welcome Message",
          description: "Welcome new clients",
          variables: ["firstName", "clinicPhone"],
        },
        {
          type: "birthday",
          name: "Birthday Wish",
          description: "Send birthday greetings with special offers",
          variables: ["firstName", "bookingUrl"],
        },
        {
          type: "follow_up",
          name: "Follow-up Message",
          description: "Check in after treatments",
          variables: ["clientName", "treatment"],
        },
      ],
      features: {
        deliveryReports: smsAttributes.DeliveryStatusLogging === "true",
        internationalSMS: true,
        scheduledSMS: false, // TODO: Implement scheduled SMS
        twoWaySMS: false, // TODO: Implement two-way SMS
      },
    });

  } catch (error: any) {
    console.error("Error getting SMS config:", error);
    return NextResponse.json(
      { error: "Failed to get SMS configuration", details: error.message },
      { status: 500 }
    );
  }
}