import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { messagingService, MessageContext } from "@/lib/messaging";
import { z } from "zod";

// Schema for sending messages
const sendMessageSchema = z.object({
  clientId: z.number().positive(),
  templateId: z.number().positive(),
  variables: z.record(z.string(), z.any()).default({}),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  scheduledFor: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// Schema for bulk message sending
const sendBulkMessageSchema = z.object({
  clientIds: z.array(z.number().positive()).min(1).max(1000),
  templateId: z.number().positive(),
  variables: z.record(z.string(), z.any()).default({}),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  scheduledFor: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// POST /api/messages/send - Send single message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = sendMessageSchema.parse(body);

    // Prepare message context
    const messageContext: MessageContext = {
      orgId: session.user.orgId,
      clientId: validatedData.clientId,
      templateId: validatedData.templateId,
      variables: validatedData.variables,
      priority: validatedData.priority,
      scheduledFor: validatedData.scheduledFor ? new Date(validatedData.scheduledFor) : undefined,
      metadata: validatedData.metadata,
    };

    // Send the message
    const result = await messagingService.sendMessage(messageContext);

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        provider: result.provider,
        deliveryId: result.deliveryId,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          deliveryId: result.deliveryId,
        },
        { status: 400 }
      );
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

// POST /api/messages/send-bulk - Send messages to multiple clients
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = sendBulkMessageSchema.parse(body);

    const results = [];
    const errors = [];

    // Send messages to each client
    for (const clientId of validatedData.clientIds) {
      try {
        const messageContext: MessageContext = {
          orgId: session.user.orgId,
          clientId,
          templateId: validatedData.templateId,
          variables: validatedData.variables,
          priority: validatedData.priority,
          scheduledFor: validatedData.scheduledFor ? new Date(validatedData.scheduledFor) : undefined,
          metadata: {
            ...validatedData.metadata,
            bulkSend: true,
            totalRecipients: validatedData.clientIds.length,
          },
        };

        const result = await messagingService.sendMessage(messageContext);
        results.push({
          clientId,
          success: result.success,
          messageId: result.messageId,
          provider: result.provider,
          deliveryId: result.deliveryId,
          error: result.error,
        });

        if (!result.success) {
          errors.push({ clientId, error: result.error });
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ clientId, error: errorMessage });
        results.push({
          clientId,
          success: false,
          error: errorMessage,
          deliveryId: 0,
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      summary: {
        total: validatedData.clientIds.length,
        successful,
        failed,
      },
      results,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error sending bulk messages:", error);
    return NextResponse.json(
      { error: "Failed to send bulk messages" },
      { status: 500 }
    );
  }
}