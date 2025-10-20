import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { subscriptionService } from "@/lib/stripe";
import { db } from "@/lib/db";
import { subscriptions as subscriptionsTable, orgs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const updateSubscriptionSchema = z.object({
  action: z.enum(['cancel', 'resume', 'change_plan']),
  plan: z.enum(['basic', 'professional', 'enterprise']).optional(),
  cancelAtPeriodEnd: z.boolean().optional().default(true),
});

// GET /api/subscriptions/manage - Get current subscription
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get current subscription
    const subscriptionResult = await db
      .select({
        id: subscriptionsTable.id,
        stripeSubscriptionId: subscriptionsTable.stripeSubscriptionId,
        stripeCustomerId: subscriptionsTable.stripeCustomerId,
        status: subscriptionsTable.status,
        currentPeriodStart: subscriptionsTable.currentPeriodStart,
        currentPeriodEnd: subscriptionsTable.currentPeriodEnd,
        cancelAtPeriodEnd: subscriptionsTable.cancelAtPeriodEnd,
        canceledAt: subscriptionsTable.canceledAt,
        orgName: orgs.name,
      })
      .from(subscriptionsTable)
      .innerJoin(orgs, eq(subscriptionsTable.orgId, orgs.id))
      .where(eq(subscriptionsTable.orgId, session.user.orgId))
      .limit(1);

    if (subscriptionResult.length === 0) {
      return NextResponse.json({
        message: "No subscription found",
        subscription: null,
        availablePlans: subscriptionService.getSubscriptionPlans(),
      });
    }

    const subscription = subscriptionResult[0];

    // Get detailed subscription info from Stripe
    const stripeSubscription = await subscriptionService.getSubscription(subscription.stripeSubscriptionId);

    // Get upcoming invoice if subscription is active
    let upcomingInvoice = null;
    if (subscription.status === 'active' || subscription.status === 'trialing') {
      try {
        upcomingInvoice = await subscriptionService.getUpcomingInvoice(subscription.stripeCustomerId);
      } catch (error) {
        console.log("No upcoming invoice found");
      }
    }

    return NextResponse.json({
      message: "Subscription retrieved successfully",
      subscription: {
        id: subscription.stripeSubscriptionId,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        canceledAt: subscription.canceledAt,
        organization: subscription.orgName,
        plan: {
          name: stripeSubscription.items.data[0]?.price?.nickname || 'Current Plan',
          amount: stripeSubscription.items.data[0]?.price?.unit_amount || 0,
          interval: stripeSubscription.items.data[0]?.price?.recurring?.interval || 'month',
        },
        upcomingInvoice: upcomingInvoice ? {
          amount: upcomingInvoice.amount_due,
          currency: upcomingInvoice.currency,
          periodStart: new Date(upcomingInvoice.period_start * 1000),
          periodEnd: new Date(upcomingInvoice.period_end * 1000),
        } : null,
      },
      availablePlans: subscriptionService.getSubscriptionPlans(),
    });

  } catch (error: any) {
    console.error("Error retrieving subscription:", error);
    return NextResponse.json(
      { error: "Failed to retrieve subscription", details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/subscriptions/manage - Update subscription
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check permissions
    if (session.user.role !== 'admin' && session.user.role !== 'owner') {
      return NextResponse.json(
        { error: "Insufficient permissions to manage subscriptions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateSubscriptionSchema.parse(body);

    // Get current subscription
    const subscriptionResult = await db
      .select({
        id: subscriptionsTable.id,
        stripeSubscriptionId: subscriptionsTable.stripeSubscriptionId,
        status: subscriptionsTable.status,
      })
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.orgId, session.user.orgId))
      .limit(1);

    if (subscriptionResult.length === 0) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    const subscription = subscriptionResult[0];
    let result;

    switch (validatedData.action) {
      case 'cancel':
        result = await subscriptionService.cancelSubscription(
          subscription.stripeSubscriptionId,
          validatedData.cancelAtPeriodEnd
        );

        await db
          .update(subscriptionsTable)
          .set({
            status: result.status,
            cancelAtPeriodEnd: result.cancel_at_period_end || false,
            canceledAt: result.canceled_at ? new Date(result.canceled_at * 1000) : null,
            updatedAt: new Date(),
          })
          .where(eq(subscriptionsTable.id, subscription.id));

        break;

      case 'resume':
        if (subscription.status !== 'active' || !subscription.stripeSubscriptionId) {
          return NextResponse.json(
            { error: "Can only resume canceled subscriptions" },
            { status: 400 }
          );
        }

        result = await subscriptionService.resumeSubscription(subscription.stripeSubscriptionId);

        await db
          .update(subscriptionsTable)
          .set({
            status: result.status,
            cancelAtPeriodEnd: false,
            canceledAt: null,
            updatedAt: new Date(),
          })
          .where(eq(subscriptionsTable.id, subscription.id));

        break;

      case 'change_plan':
        if (!validatedData.plan) {
          return NextResponse.json(
            { error: "Plan is required for plan change" },
            { status: 400 }
          );
        }

        const plans = subscriptionService.getSubscriptionPlans();
        const newPlan = plans.find(p => p.id === validatedData.plan);

        if (!newPlan) {
          return NextResponse.json(
            { error: "Invalid subscription plan" },
            { status: 400 }
          );
        }

        const updateResult = await subscriptionService.updateSubscription(
          subscription.stripeSubscriptionId,
          {
            priceId: newPlan.priceId!,
            prorationBehavior: 'create_prorations',
            metadata: {
              planChanged: new Date().toISOString(),
              newPlan: newPlan.name,
              changedBy: session.user.id.toString(),
            },
          }
        );

        await db
          .update(subscriptionsTable)
          .set({
            status: updateResult.status,
            currentPeriodStart: updateResult.currentPeriodStart,
            currentPeriodEnd: updateResult.currentPeriodEnd,
            updatedAt: new Date(),
          })
          .where(eq(subscriptionsTable.id, subscription.id));

        result = updateResult;
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: `Subscription ${validatedData.action} successful`,
      subscription: {
        id: subscription.stripeSubscriptionId,
        status: result.status || subscription.status,
        action: validatedData.action,
        ...(validatedData.action === 'change_plan' && { newPlan: validatedData.plan }),
      },
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: "Failed to update subscription", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/subscriptions/manage - Create billing portal session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check permissions
    if (session.user.role !== 'admin' && session.user.role !== 'owner') {
      return NextResponse.json(
        { error: "Insufficient permissions to access billing portal" },
        { status: 403 }
      );
    }

    // Get current subscription
    const subscriptionResult = await db
      .select({
        stripeCustomerId: subscriptionsTable.stripeCustomerId,
      })
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.orgId, session.user.orgId))
      .limit(1);

    if (subscriptionResult.length === 0) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    const subscription = subscriptionResult[0];
    const returnUrl = `${process.env.NEXTAUTH_URL}/settings/billing`;

    // Create billing portal session
    const portalSession = await subscriptionService.createBillingPortalSession(
      subscription.stripeCustomerId,
      returnUrl
    );

    return NextResponse.json({
      message: "Billing portal session created",
      url: portalSession.url,
    });

  } catch (error: any) {
    console.error("Error creating billing portal session:", error);
    return NextResponse.json(
      { error: "Failed to create billing portal session", details: error.message },
      { status: 500 }
    );
  }
}