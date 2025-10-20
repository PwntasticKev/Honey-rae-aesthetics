import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { paymentService } from "@/lib/stripe";
import { db } from "@/lib/db";
import { appointments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const createRefundSchema = z.object({
  paymentIntentId: z.string().min(1, "Payment intent ID is required"),
  amount: z.number().optional(),
  reason: z.enum(['duplicate', 'fraudulent', 'requested_by_customer']).optional(),
  appointmentId: z.number().optional(),
  refundReason: z.string().optional(),
});

// POST /api/payments/refund - Create refund for payment
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
    const validatedData = createRefundSchema.parse(body);

    // Verify payment intent belongs to this organization
    let appointment = null;
    if (validatedData.appointmentId) {
      const appointmentResult = await db
        .select({
          id: appointments.id,
          paymentIntentId: appointments.paymentIntentId,
          price: appointments.price,
          status: appointments.status,
        })
        .from(appointments)
        .where(
          and(
            eq(appointments.id, validatedData.appointmentId),
            eq(appointments.orgId, session.user.orgId),
            eq(appointments.paymentIntentId, validatedData.paymentIntentId)
          )
        )
        .limit(1);

      if (appointmentResult.length === 0) {
        return NextResponse.json(
          { error: "Appointment not found or payment intent mismatch" },
          { status: 404 }
        );
      }

      appointment = appointmentResult[0];

      if (appointment.status !== 'paid') {
        return NextResponse.json(
          { error: "Cannot refund unpaid appointment" },
          { status: 400 }
        );
      }
    }

    // Create refund
    const refund = await paymentService.createRefund({
      paymentIntentId: validatedData.paymentIntentId,
      amount: validatedData.amount,
      reason: validatedData.reason || 'requested_by_customer',
      metadata: {
        orgId: session.user.orgId.toString(),
        refundedBy: session.user.id.toString(),
        appointmentId: validatedData.appointmentId?.toString() || '',
        refundReason: validatedData.refundReason || 'Customer refund request',
      },
    });

    // Update appointment status if applicable
    if (appointment) {
      const refundStatus = refund.amount && appointment.price 
        ? (refund.amount >= Math.round(appointment.price * 100) ? 'refunded' : 'partially_refunded')
        : 'refunded';

      await db
        .update(appointments)
        .set({
          status: refundStatus,
          refundedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(appointments.id, appointment.id));
    }

    return NextResponse.json({
      message: "Refund processed successfully",
      refund: {
        id: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason,
      },
      appointment: appointment ? {
        id: appointment.id,
        status: refund.amount && appointment.price 
          ? (refund.amount >= Math.round(appointment.price * 100) ? 'refunded' : 'partially_refunded')
          : 'refunded',
      } : null,
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error processing refund:", error);
    return NextResponse.json(
      { error: "Failed to process refund", details: error.message },
      { status: 500 }
    );
  }
}