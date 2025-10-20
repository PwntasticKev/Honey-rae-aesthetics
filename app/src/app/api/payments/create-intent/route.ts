import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { paymentService } from "@/lib/stripe";
import { db } from "@/lib/db";
import { clients, appointments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

// Schema for creating payment intent
const createPaymentIntentSchema = z.object({
  amount: z.number().min(50, "Minimum amount is $0.50").max(99999999, "Maximum amount exceeded"),
  currency: z.string().optional().default("usd"),
  appointmentId: z.number().optional(),
  clientId: z.number().optional(),
  description: z.string().optional(),
  metadata: z.record(z.string()).optional(),
  savePaymentMethod: z.boolean().optional().default(false),
});

// POST /api/payments/create-intent - Create payment intent for appointment or service
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
    const validatedData = createPaymentIntentSchema.parse(body);

    let client = null;
    let appointment = null;
    let stripeCustomerId = null;

    // Verify appointment if provided
    if (validatedData.appointmentId) {
      const appointmentResult = await db
        .select({
          id: appointments.id,
          clientId: appointments.clientId,
          title: appointments.title,
          price: appointments.price,
          status: appointments.status,
        })
        .from(appointments)
        .where(
          and(
            eq(appointments.id, validatedData.appointmentId),
            eq(appointments.orgId, session.user.orgId)
          )
        )
        .limit(1);

      if (appointmentResult.length === 0) {
        return NextResponse.json(
          { error: "Appointment not found or not accessible" },
          { status: 404 }
        );
      }

      appointment = appointmentResult[0];

      if (appointment.status === 'completed' || appointment.status === 'paid') {
        return NextResponse.json(
          { error: "Appointment already paid or completed" },
          { status: 400 }
        );
      }

      // Use appointment price if no amount specified
      if (!validatedData.amount && appointment.price) {
        validatedData.amount = Math.round(appointment.price * 100); // Convert to cents
      }

      validatedData.clientId = appointment.clientId;
    }

    // Get or create client and Stripe customer
    if (validatedData.clientId) {
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

      client = clientResult[0];

      // Create or get Stripe customer
      if (!client.stripeCustomerId) {
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
      } else {
        stripeCustomerId = client.stripeCustomerId;
      }
    }

    // Create payment intent
    const paymentResult = await paymentService.createPaymentIntent({
      amount: validatedData.amount,
      currency: validatedData.currency,
      customerId: stripeCustomerId || undefined,
      appointmentId: validatedData.appointmentId,
      clientId: validatedData.clientId,
      orgId: session.user.orgId,
      description: validatedData.description || 
        (appointment ? `Payment for ${appointment.title}` : 'Service payment - Honey Rae Aesthetics'),
      metadata: {
        ...validatedData.metadata,
        createdBy: session.user.id.toString(),
        ...(appointment && { appointmentTitle: appointment.title }),
        ...(client && { clientName: `${client.firstName} ${client.lastName}` }),
      },
    });

    // Update appointment with payment intent if applicable
    if (appointment) {
      await db
        .update(appointments)
        .set({
          paymentIntentId: paymentResult.paymentIntentId,
          status: 'payment_pending',
          updatedAt: new Date(),
        })
        .where(eq(appointments.id, appointment.id));
    }

    return NextResponse.json({
      message: "Payment intent created successfully",
      paymentIntent: {
        id: paymentResult.paymentIntentId,
        clientSecret: paymentResult.clientSecret,
        amount: paymentResult.amount,
        currency: paymentResult.currency,
        status: paymentResult.status,
      },
      client: client ? {
        id: client.id,
        name: `${client.firstName} ${client.lastName}`,
        email: client.email,
        stripeCustomerId,
      } : null,
      appointment: appointment ? {
        id: appointment.id,
        title: appointment.title,
        price: appointment.price,
      } : null,
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { error: "Failed to create payment intent", details: error.message },
      { status: 500 }
    );
  }
}