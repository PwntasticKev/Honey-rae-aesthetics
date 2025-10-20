import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orgs, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

// Schema for subscription updates
const updateSubscriptionSchema = z.object({
  subscriptionTier: z.enum(["basic", "pro", "enterprise"]).optional(),
  status: z.enum(["active", "suspended", "pending"]).optional(),
  monthlyRevenue: z.number().min(0).optional(),
});

// GET /api/master-admin/subscriptions/[id] - Get detailed subscription info
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orgId = parseInt(params.id);
    
    if (isNaN(orgId)) {
      return NextResponse.json(
        { error: "Invalid organization ID" },
        { status: 400 }
      );
    }

    // Get organization with detailed subscription and usage data
    const subscriptionDetails = await db
      .select({
        id: orgs.id,
        orgName: orgs.name,
        orgEmail: orgs.email,
        orgStatus: orgs.status,
        subscriptionTier: orgs.subscriptionTier,
        monthlyRevenue: orgs.monthlyRevenue,
        maxUsers: orgs.maxUsers,
        createdAt: orgs.createdAt,
        updatedAt: orgs.updatedAt,
        // Current usage stats
        currentUsers: sql<number>`(
          SELECT COUNT(*) 
          FROM ${users} 
          WHERE ${users.orgId} = ${orgs.id} AND ${users.isActive} = true
        )`.as('currentUsers'),
        totalUsers: sql<number>`(
          SELECT COUNT(*) 
          FROM ${users} 
          WHERE ${users.orgId} = ${orgs.id}
        )`.as('totalUsers'),
        adminUsers: sql<number>`(
          SELECT COUNT(*) 
          FROM ${users} 
          WHERE ${users.orgId} = ${orgs.id} AND ${users.role} IN ('owner', 'admin')
        )`.as('adminUsers'),
        lastUserActivity: sql<string>`(
          SELECT MAX(${users.lastLoginAt}) 
          FROM ${users} 
          WHERE ${users.orgId} = ${orgs.id}
        )`.as('lastUserActivity'),
      })
      .from(orgs)
      .where(eq(orgs.id, orgId))
      .limit(1);

    if (!subscriptionDetails.length) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const org = subscriptionDetails[0];

    // Generate mock subscription data (replace with real Stripe data)
    const subscriptionData = {
      ...org,
      subscription: {
        id: `sub_${org.id}_mock`,
        status: org.orgStatus === "active" ? "active" : 
                org.orgStatus === "suspended" ? "cancelled" : "trialing",
        currentPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        trialEnd: org.orgStatus === "pending" ? 
          new Date(org.createdAt.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString() : null,
      },
      billing: {
        amount: org.subscriptionTier === "basic" ? 2999 : 
                org.subscriptionTier === "pro" ? 9999 : 29999, // cents
        currency: "usd",
        interval: "month",
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        lastPaymentDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        paymentMethod: {
          type: "card",
          last4: "4242",
          brand: "visa",
        },
      },
      usage: {
        currentUsers: org.currentUsers,
        maxUsers: org.maxUsers,
        usagePercentage: Math.round((org.currentUsers / org.maxUsers) * 100),
        // Mock usage metrics
        apiCalls: Math.floor(Math.random() * 50000) + 10000,
        storageUsed: Math.floor(Math.random() * 10) + 2, // GB
        emailsSent: Math.floor(Math.random() * 1000) + 100,
        smsSent: Math.floor(Math.random() * 500) + 50,
      },
      // Payment history (mock data)
      paymentHistory: [
        {
          id: `pi_${org.id}_1`,
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          amount: org.subscriptionTier === "basic" ? 2999 : 
                  org.subscriptionTier === "pro" ? 9999 : 29999,
          status: "succeeded",
          description: `${org.subscriptionTier.charAt(0).toUpperCase() + org.subscriptionTier.slice(1)} Plan - Monthly`,
        },
        {
          id: `pi_${org.id}_2`,
          date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          amount: org.subscriptionTier === "basic" ? 2999 : 
                  org.subscriptionTier === "pro" ? 9999 : 29999,
          status: "succeeded",
          description: `${org.subscriptionTier.charAt(0).toUpperCase() + org.subscriptionTier.slice(1)} Plan - Monthly`,
        },
      ],
      // Alerts for this subscription
      alerts: generateSubscriptionAlerts(org),
    };

    return NextResponse.json(subscriptionData);

  } catch (error) {
    console.error("Error fetching subscription details:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription details" },
      { status: 500 }
    );
  }
}

// PATCH /api/master-admin/subscriptions/[id] - Update subscription
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orgId = parseInt(params.id);
    
    if (isNaN(orgId)) {
      return NextResponse.json(
        { error: "Invalid organization ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateSubscriptionSchema.parse(body);

    // Check if organization exists
    const existingOrg = await db
      .select({ id: orgs.id, subscriptionTier: orgs.subscriptionTier })
      .from(orgs)
      .where(eq(orgs.id, orgId))
      .limit(1);

    if (!existingOrg.length) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Update organization subscription data
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    };

    // Update max users based on subscription tier
    if (validatedData.subscriptionTier) {
      updateData.maxUsers = validatedData.subscriptionTier === "basic" ? 5 : 
                           validatedData.subscriptionTier === "pro" ? 25 : 100;
    }

    await db
      .update(orgs)
      .set(updateData)
      .where(eq(orgs.id, orgId));

    // Get updated organization
    const updatedOrg = await db
      .select()
      .from(orgs)
      .where(eq(orgs.id, orgId))
      .limit(1);

    return NextResponse.json({
      message: "Subscription updated successfully",
      organization: updatedOrg[0],
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 }
    );
  }
}

// Helper function to generate subscription-specific alerts
function generateSubscriptionAlerts(org: any) {
  const alerts = [];
  const now = new Date();

  // Usage alert
  const usagePercentage = Math.round((org.currentUsers / org.maxUsers) * 100);
  if (usagePercentage > 90) {
    alerts.push({
      type: "high_usage",
      severity: usagePercentage > 95 ? "critical" : "warning",
      message: `User capacity at ${usagePercentage}% (${org.currentUsers}/${org.maxUsers})`,
      recommendation: "Consider upgrading to a higher tier",
    });
  }

  // Trial expiring alert
  if (org.orgStatus === "pending") {
    const trialEnd = new Date(org.createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    
    if (daysLeft <= 7) {
      alerts.push({
        type: "trial_expiring",
        severity: daysLeft <= 3 ? "critical" : "warning",
        message: `Trial expires in ${daysLeft} days`,
        recommendation: "Upgrade to a paid plan to continue service",
      });
    }
  }

  // Payment due alert
  const nextPayment = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Mock: 7 days from now
  const daysUntilPayment = Math.ceil((nextPayment.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  
  if (daysUntilPayment <= 3 && org.orgStatus === "active") {
    alerts.push({
      type: "payment_due",
      severity: "info",
      message: `Next payment due in ${daysUntilPayment} days`,
      recommendation: "Ensure payment method is up to date",
    });
  }

  // Inactive organization alert
  if (org.lastUserActivity) {
    const lastActivity = new Date(org.lastUserActivity);
    const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (24 * 60 * 60 * 1000));
    
    if (daysSinceActivity > 30) {
      alerts.push({
        type: "inactive_organization",
        severity: "warning",
        message: `No user activity for ${daysSinceActivity} days`,
        recommendation: "Consider reaching out to organization admins",
      });
    }
  }

  return alerts;
}