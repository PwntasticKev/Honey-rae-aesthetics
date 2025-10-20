import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { subscriptionService, paymentService } from "@/lib/stripe";
import { db } from "@/lib/db";
import { orgs, subscriptions as subscriptionsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const createSubscriptionSchema = z.object({
  plan: z.enum(['basic', 'professional', 'enterprise']),
  trialDays: z.number().min(0).max(30).optional(),
  paymentMethodId: z.string().optional(),
});

// POST /api/subscriptions/create - Create subscription for organization
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user has subscription management permissions
    // This should be restricted to admin users
    if (session.user.role !== 'admin' && session.user.role !== 'owner') {
      return NextResponse.json(
        { error: "Insufficient permissions to manage subscriptions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createSubscriptionSchema.parse(body);

    // Get organization details
    const orgResult = await db
      .select({
        id: orgs.id,
        name: orgs.name,
        email: orgs.email,
        phone: orgs.phone,
        stripeCustomerId: orgs.stripeCustomerId,
      })
      .from(orgs)
      .where(eq(orgs.id, session.user.orgId))
      .limit(1);

    if (orgResult.length === 0) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const org = orgResult[0];

    // Check if organization already has an active subscription
    const existingSubscription = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.orgId, org.id))
      .limit(1);

    if (existingSubscription.length > 0 && existingSubscription[0].status === 'active') {
      return NextResponse.json(
        { error: "Organization already has an active subscription" },
        { status: 400 }
      );
    }

    let stripeCustomerId = org.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId) {
      const stripeCustomer = await paymentService.createCustomer({
        email: org.email,
        name: org.name,
        phone: org.phone || undefined,
        metadata: {
          orgId: org.id.toString(),
          platform: 'honey-rae-aesthetics',
        },
      });

      stripeCustomerId = stripeCustomer.id;

      // Update organization with Stripe customer ID
      await db
        .update(orgs)
        .set({ stripeCustomerId: stripeCustomer.id })
        .where(eq(orgs.id, org.id));
    }

    // Get plan details from config
    const plans = subscriptionService.getSubscriptionPlans();
    const selectedPlan = plans.find(p => p.id === validatedData.plan);

    if (!selectedPlan) {
      return NextResponse.json(
        { error: "Invalid subscription plan" },
        { status: 400 }
      );
    }

    // Create subscription
    const subscription = await subscriptionService.createSubscription({
      customerId: stripeCustomerId,
      priceId: selectedPlan.priceId!,
      orgId: org.id,
      trialDays: validatedData.trialDays,
      metadata: {
        orgName: org.name,
        planName: selectedPlan.name,
        createdBy: session.user.id.toString(),
      },
    });

    // Save subscription to database
    await db
      .insert(subscriptionsTable)
      .values({
        orgId: org.id,
        stripeSubscriptionId: subscription.subscriptionId,
        stripeCustomerId,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    return NextResponse.json({
      message: "Subscription created successfully",
      subscription: {
        id: subscription.subscriptionId,
        status: subscription.status,
        plan: selectedPlan.name,
        amount: selectedPlan.formattedPrice,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        clientSecret: subscription.clientSecret,
        latestInvoice: subscription.latestInvoice,
      },
      organization: {
        id: org.id,
        name: org.name,
        stripeCustomerId,
      },
      nextAction: subscription.latestInvoice?.paymentIntent?.clientSecret 
        ? "complete_payment" 
        : "subscription_active",
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Failed to create subscription", details: error.message },
      { status: 500 }
    );
  }
}