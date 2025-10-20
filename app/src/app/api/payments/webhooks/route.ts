import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripeService } from "@/lib/stripe";
import { db } from "@/lib/db";
import { appointments, clients, subscriptions as subscriptionsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const event = stripeService.validateWebhookSignature(body, signature);

    console.log("🔔 Webhook received:", event.type);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleSubscriptionPaymentSuccess(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleSubscriptionPaymentFailed(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object);
        break;

      case 'setup_intent.succeeded':
        await handleSetupIntentSuccess(event.data.object);
        break;

      default:
        console.log(`🔔 Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed", details: error.message },
      { status: 400 }
    );
  }
}

async function handlePaymentSuccess(paymentIntent: any) {
  try {
    const appointmentId = paymentIntent.metadata?.appointmentId;
    
    if (appointmentId) {
      // Update appointment status to paid
      await db
        .update(appointments)
        .set({
          status: 'paid',
          paidAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(appointments.id, parseInt(appointmentId)));

      console.log(`✅ Appointment ${appointmentId} marked as paid`);
    }

    // Log successful payment
    console.log(`💰 Payment succeeded: ${paymentIntent.id} for ${paymentIntent.amount / 100} ${paymentIntent.currency.toUpperCase()}`);

  } catch (error) {
    console.error("Error handling payment success:", error);
  }
}

async function handlePaymentFailed(paymentIntent: any) {
  try {
    const appointmentId = paymentIntent.metadata?.appointmentId;
    
    if (appointmentId) {
      // Update appointment status to payment failed
      await db
        .update(appointments)
        .set({
          status: 'payment_failed',
          updatedAt: new Date(),
        })
        .where(eq(appointments.id, parseInt(appointmentId)));

      console.log(`❌ Appointment ${appointmentId} payment failed`);
    }

    console.log(`💳 Payment failed: ${paymentIntent.id}`);

  } catch (error) {
    console.error("Error handling payment failure:", error);
  }
}

async function handlePaymentCanceled(paymentIntent: any) {
  try {
    const appointmentId = paymentIntent.metadata?.appointmentId;
    
    if (appointmentId) {
      // Revert appointment status to confirmed
      await db
        .update(appointments)
        .set({
          status: 'confirmed',
          paymentIntentId: null,
          updatedAt: new Date(),
        })
        .where(eq(appointments.id, parseInt(appointmentId)));

      console.log(`🔄 Appointment ${appointmentId} payment canceled, reverted to confirmed`);
    }

    console.log(`🚫 Payment canceled: ${paymentIntent.id}`);

  } catch (error) {
    console.error("Error handling payment cancellation:", error);
  }
}

async function handleSubscriptionPaymentSuccess(invoice: any) {
  try {
    const subscriptionId = invoice.subscription;
    const customerId = invoice.customer;

    // Update subscription status and next payment date
    if (subscriptionId) {
      await db
        .update(subscriptionsTable)
        .set({
          status: 'active',
          currentPeriodEnd: new Date(invoice.period_end * 1000),
          updatedAt: new Date(),
        })
        .where(eq(subscriptionsTable.stripeSubscriptionId, subscriptionId));

      console.log(`📅 Subscription ${subscriptionId} payment succeeded`);
    }

  } catch (error) {
    console.error("Error handling subscription payment success:", error);
  }
}

async function handleSubscriptionPaymentFailed(invoice: any) {
  try {
    const subscriptionId = invoice.subscription;

    if (subscriptionId) {
      await db
        .update(subscriptionsTable)
        .set({
          status: 'past_due',
          updatedAt: new Date(),
        })
        .where(eq(subscriptionsTable.stripeSubscriptionId, subscriptionId));

      console.log(`⚠️ Subscription ${subscriptionId} payment failed - marked as past due`);
    }

  } catch (error) {
    console.error("Error handling subscription payment failure:", error);
  }
}

async function handleSubscriptionCreated(subscription: any) {
  try {
    const customerId = subscription.customer;
    const subscriptionId = subscription.id;

    // Find org by Stripe customer ID and create subscription record
    const customerResult = await db
      .select({ orgId: clients.orgId })
      .from(clients)
      .where(eq(clients.stripeCustomerId, customerId))
      .limit(1);

    if (customerResult.length > 0) {
      const orgId = customerResult[0].orgId;

      await db
        .insert(subscriptionsTable)
        .values({
          orgId,
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId: customerId,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      console.log(`🆕 Subscription created for org ${orgId}: ${subscriptionId}`);
    }

  } catch (error) {
    console.error("Error handling subscription creation:", error);
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  try {
    const subscriptionId = subscription.id;

    await db
      .update(subscriptionsTable)
      .set({
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        updatedAt: new Date(),
      })
      .where(eq(subscriptionsTable.stripeSubscriptionId, subscriptionId));

    console.log(`🔄 Subscription updated: ${subscriptionId}`);

  } catch (error) {
    console.error("Error handling subscription update:", error);
  }
}

async function handleSubscriptionCanceled(subscription: any) {
  try {
    const subscriptionId = subscription.id;

    await db
      .update(subscriptionsTable)
      .set({
        status: 'canceled',
        canceledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(subscriptionsTable.stripeSubscriptionId, subscriptionId));

    console.log(`❌ Subscription canceled: ${subscriptionId}`);

  } catch (error) {
    console.error("Error handling subscription cancellation:", error);
  }
}

async function handleSetupIntentSuccess(setupIntent: any) {
  try {
    const customerId = setupIntent.customer;
    
    console.log(`💳 Payment method saved for customer: ${customerId}`);
    // Additional logic for handling saved payment methods can be added here

  } catch (error) {
    console.error("Error handling setup intent success:", error);
  }
}