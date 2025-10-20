import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { paymentService } from "@/lib/stripe";
import { db } from "@/lib/db";
import { clients } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const paymentMethodsQuerySchema = z.object({
  clientId: z.string().transform(Number),
});

const setupIntentSchema = z.object({
  clientId: z.number(),
});

// GET /api/payments/payment-methods - Get customer's saved payment methods
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
    const queryData = paymentMethodsQuerySchema.parse({
      clientId: searchParams.get('clientId'),
    });

    // Get client and verify access
    const clientResult = await db
      .select({
        id: clients.id,
        stripeCustomerId: clients.stripeCustomerId,
        firstName: clients.firstName,
        lastName: clients.lastName,
        email: clients.email,
      })
      .from(clients)
      .where(
        and(
          eq(clients.id, queryData.clientId),
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

    const client = clientResult[0];

    if (!client.stripeCustomerId) {
      return NextResponse.json({
        message: "No payment methods found",
        paymentMethods: [],
        client: {
          id: client.id,
          name: `${client.firstName} ${client.lastName}`,
          email: client.email,
        },
      });
    }

    // Get customer's payment methods
    const paymentMethods = await paymentService.getCustomerPaymentMethods(client.stripeCustomerId);

    return NextResponse.json({
      message: "Payment methods retrieved successfully",
      paymentMethods: paymentMethods.map(pm => ({
        id: pm.id,
        type: pm.type,
        card: pm.card ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year,
        } : null,
        created: new Date(pm.created * 1000),
      })),
      client: {
        id: client.id,
        name: `${client.firstName} ${client.lastName}`,
        email: client.email,
        stripeCustomerId: client.stripeCustomerId,
      },
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error retrieving payment methods:", error);
    return NextResponse.json(
      { error: "Failed to retrieve payment methods", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/payments/payment-methods - Create setup intent for saving payment method
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
    const validatedData = setupIntentSchema.parse(body);

    // Get client and verify access
    const clientResult = await db
      .select({
        id: clients.id,
        firstName: clients.firstName,
        lastName: clients.lastName,
        email: clients.email,
        phone: clients.phone,
        stripeCustomerId: clients.stripeCustomerId,
      })
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

    const client = clientResult[0];
    let stripeCustomerId = client.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId) {
      const stripeCustomer = await paymentService.createCustomer({
        email: client.email,
        name: `${client.firstName} ${client.lastName}`.trim(),
        phone: client.phone || undefined,
        metadata: {
          clientId: client.id.toString(),
          orgId: session.user.orgId.toString(),
        },
      });

      stripeCustomerId = stripeCustomer.id;

      // Update client with Stripe customer ID
      await db
        .update(clients)
        .set({ stripeCustomerId: stripeCustomer.id })
        .where(eq(clients.id, client.id));
    }

    // Create setup intent
    const setupIntent = await paymentService.createSetupIntent(stripeCustomerId);

    return NextResponse.json({
      message: "Setup intent created successfully",
      setupIntent: {
        id: setupIntent.setupIntentId,
        clientSecret: setupIntent.clientSecret,
      },
      client: {
        id: client.id,
        name: `${client.firstName} ${client.lastName}`,
        email: client.email,
        stripeCustomerId,
      },
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating setup intent:", error);
    return NextResponse.json(
      { error: "Failed to create setup intent", details: error.message },
      { status: 500 }
    );
  }
}