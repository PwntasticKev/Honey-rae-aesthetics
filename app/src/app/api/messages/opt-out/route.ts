import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { clientCommunicationPreferences, clients } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";

// Schema for opt-out requests
const optOutSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  type: z.enum(['email', 'sms', 'all']),
  token: z.string().optional(), // For secure opt-out links
}).refine((data) => {
  return data.email || data.phone;
}, {
  message: "Either email or phone must be provided",
});

// Schema for opt-in requests (requires authentication)
const optInSchema = z.object({
  clientId: z.number().positive(),
  type: z.enum(['email', 'sms', 'all']),
});

// POST /api/messages/opt-out - Handle opt-out requests (public endpoint)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = optOutSchema.parse(body);

    // Find client by email or phone
    let client = null;
    if (validatedData.email) {
      const clientResult = await db
        .select()
        .from(clients)
        .where(eq(clients.email, validatedData.email))
        .limit(1);
      client = clientResult[0] || null;
    } else if (validatedData.phone) {
      // Search for phone in phones array - this requires a more complex query
      const clientsWithPhone = await db
        .select()
        .from(clients)
        .where(sql`JSON_CONTAINS(${clients.phones}, JSON_QUOTE(${validatedData.phone}))`);
      client = clientsWithPhone[0] || null;
    }

    if (!client) {
      // Even if client not found, return success for privacy
      return NextResponse.json({
        success: true,
        message: "Opt-out request processed",
      });
    }

    // Get or create communication preferences
    const existingPrefs = await db
      .select()
      .from(clientCommunicationPreferences)
      .where(eq(clientCommunicationPreferences.clientId, client.id))
      .limit(1);

    const updateData: any = {
      lastUpdated: new Date(),
    };

    switch (validatedData.type) {
      case 'email':
        updateData.emailOptOut = true;
        updateData.emailOptOutDate = new Date();
        break;
      case 'sms':
        updateData.smsOptOut = true;
        updateData.smsOptOutDate = new Date();
        break;
      case 'all':
        updateData.emailOptOut = true;
        updateData.smsOptOut = true;
        updateData.emailOptOutDate = new Date();
        updateData.smsOptOutDate = new Date();
        break;
    }

    if (existingPrefs.length > 0) {
      // Update existing preferences
      await db
        .update(clientCommunicationPreferences)
        .set(updateData)
        .where(eq(clientCommunicationPreferences.id, existingPrefs[0].id));
    } else {
      // Create new preferences record
      await db.insert(clientCommunicationPreferences).values({
        clientId: client.id,
        orgId: client.orgId,
        ...updateData,
      });
    }

    // Log the opt-out for compliance
    console.log(`Client ${client.id} opted out of ${validatedData.type} communications`, {
      clientId: client.id,
      email: validatedData.email,
      phone: validatedData.phone,
      type: validatedData.type,
      timestamp: new Date(),
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      message: "You have been successfully opted out of communications",
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error processing opt-out:", error);
    return NextResponse.json(
      { error: "Failed to process opt-out request" },
      { status: 500 }
    );
  }
}

// PATCH /api/messages/opt-out - Handle opt-in requests (authenticated)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = optInSchema.parse(body);

    // Verify client belongs to this org
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
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Get or create communication preferences
    const existingPrefs = await db
      .select()
      .from(clientCommunicationPreferences)
      .where(eq(clientCommunicationPreferences.clientId, validatedData.clientId))
      .limit(1);

    const updateData: any = {
      lastUpdated: new Date(),
    };

    switch (validatedData.type) {
      case 'email':
        updateData.emailOptOut = false;
        updateData.emailOptOutDate = null;
        break;
      case 'sms':
        updateData.smsOptOut = false;
        updateData.smsOptOutDate = null;
        break;
      case 'all':
        updateData.emailOptOut = false;
        updateData.smsOptOut = false;
        updateData.emailOptOutDate = null;
        updateData.smsOptOutDate = null;
        break;
    }

    if (existingPrefs.length > 0) {
      // Update existing preferences
      await db
        .update(clientCommunicationPreferences)
        .set(updateData)
        .where(eq(clientCommunicationPreferences.id, existingPrefs[0].id));
    } else {
      // Create new preferences record
      await db.insert(clientCommunicationPreferences).values({
        clientId: validatedData.clientId,
        orgId: session.user.orgId,
        ...updateData,
      });
    }

    // Log the opt-in for compliance
    console.log(`Client ${validatedData.clientId} opted back in to ${validatedData.type} communications`, {
      clientId: validatedData.clientId,
      type: validatedData.type,
      timestamp: new Date(),
      changedBy: session.user.id,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      message: "Communication preferences updated successfully",
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error processing opt-in:", error);
    return NextResponse.json(
      { error: "Failed to update communication preferences" },
      { status: 500 }
    );
  }
}

// GET /api/messages/opt-out - Get client communication preferences (authenticated)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      );
    }

    // Get client communication preferences
    const preferences = await db
      .select({
        client: clients,
        preferences: clientCommunicationPreferences,
      })
      .from(clients)
      .leftJoin(
        clientCommunicationPreferences,
        eq(clients.id, clientCommunicationPreferences.clientId)
      )
      .where(
        and(
          eq(clients.id, parseInt(clientId)),
          eq(clients.orgId, session.user.orgId)
        )
      )
      .limit(1);

    if (preferences.length === 0) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    const { client, preferences: prefs } = preferences[0];

    return NextResponse.json({
      clientId: client.id,
      clientName: client.fullName,
      email: client.email,
      phones: client.phones,
      preferences: {
        emailOptOut: prefs?.emailOptOut || false,
        smsOptOut: prefs?.smsOptOut || false,
        emailOptOutDate: prefs?.emailOptOutDate,
        smsOptOutDate: prefs?.smsOptOutDate,
        lastUpdated: prefs?.lastUpdated,
      },
      canReceiveEmail: !prefs?.emailOptOut && client.email,
      canReceiveSMS: !prefs?.smsOptOut && client.phones?.length > 0,
    });

  } catch (error) {
    console.error("Error fetching communication preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch communication preferences" },
      { status: 500 }
    );
  }
}

// Helper function to generate secure opt-out links
export function generateOptOutLink(
  client: { id: number; email?: string; phones?: string[] },
  type: 'email' | 'sms' | 'all'
): string {
  // Generate a secure token for the opt-out link
  const token = generateSecureToken(client.id, type);
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  return `${baseUrl}/opt-out?token=${token}&type=${type}`;
}

// Helper function to generate secure tokens
function generateSecureToken(clientId: number, type: string): string {
  // This should use a proper JWT or signed token in production
  // For now, using a simple base64 encoding
  const payload = {
    clientId,
    type,
    timestamp: Date.now(),
  };
  
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

// Helper function to validate opt-out tokens
export function validateOptOutToken(token: string): { clientId: number; type: string } | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64url').toString());
    
    // Check if token is not too old (e.g., 30 days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    if (payload.timestamp < thirtyDaysAgo) {
      return null;
    }
    
    return {
      clientId: payload.clientId,
      type: payload.type,
    };
  } catch (error) {
    return null;
  }
}