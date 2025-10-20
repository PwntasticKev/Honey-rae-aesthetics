import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orgs, users, subscriptions } from "@/db/schema";
import { eq, desc, sql, and, or, gte, lte } from "drizzle-orm";
import { z } from "zod";

// Schema for subscription filtering
const subscriptionFilterSchema = z.object({
  status: z.enum(["all", "active", "trial", "expired", "cancelled"]).optional(),
  tier: z.enum(["all", "basic", "pro", "enterprise"]).optional(),
  search: z.string().optional(),
  dueWithin: z.coerce.number().optional(), // days
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
});

// GET /api/master-admin/subscriptions - Get all subscriptions with status
export async function GET(request: NextRequest) {
  try {
    // TODO: Add master admin authentication check
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.isMasterOwner) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const {
      status = "all",
      tier = "all",
      search = "",
      dueWithin,
      page = 1,
      limit = 20
    } = subscriptionFilterSchema.parse(Object.fromEntries(searchParams));

    const offset = (page - 1) * limit;

    // Get organizations with subscription details and usage stats
    let subscriptionQuery = db
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
        // Calculate current user count
        currentUsers: sql<number>`(
          SELECT COUNT(*) 
          FROM ${users} 
          WHERE ${users.orgId} = ${orgs.id} AND ${users.isActive} = true
        )`.as('currentUsers'),
        // Mock subscription data (replace with real subscription table joins)
        subscriptionId: sql<number>`${orgs.id}`.as('subscriptionId'),
        subscriptionStatus: sql<string>`
          CASE 
            WHEN ${orgs.status} = 'active' THEN 'active'
            WHEN ${orgs.status} = 'suspended' THEN 'cancelled'
            ELSE 'trial'
          END
        `.as('subscriptionStatus'),
        // Mock billing data
        nextBillingDate: sql<string>`DATE_ADD(${orgs.createdAt}, INTERVAL 30 DAY)`.as('nextBillingDate'),
        lastBillingDate: sql<string>`DATE_SUB(NOW(), INTERVAL 30 DAY)`.as('lastBillingDate'),
        billingAmount: sql<number>`
          CASE 
            WHEN ${orgs.subscriptionTier} = 'basic' THEN 29.99
            WHEN ${orgs.subscriptionTier} = 'pro' THEN 99.99
            WHEN ${orgs.subscriptionTier} = 'enterprise' THEN 299.99
            ELSE 0
          END
        `.as('billingAmount'),
        // Usage metrics (mock data)
        usageScore: sql<number>`
          ROUND((
            SELECT COUNT(*) 
            FROM ${users} 
            WHERE ${users.orgId} = ${orgs.id} AND ${users.isActive} = true
          ) / ${orgs.maxUsers} * 100)
        `.as('usageScore'),
      })
      .from(orgs);

    // Apply search filter
    if (search) {
      subscriptionQuery = subscriptionQuery.where(
        or(
          sql`${orgs.name} LIKE ${`%${search}%`}`,
          sql`${orgs.email} LIKE ${`%${search}%`}`
        )
      );
    }

    // Apply status filter
    if (status !== "all") {
      switch (status) {
        case "active":
          subscriptionQuery = subscriptionQuery.where(eq(orgs.status, "active"));
          break;
        case "trial":
          subscriptionQuery = subscriptionQuery.where(eq(orgs.status, "pending"));
          break;
        case "expired":
        case "cancelled":
          subscriptionQuery = subscriptionQuery.where(eq(orgs.status, "suspended"));
          break;
      }
    }

    // Apply tier filter
    if (tier !== "all") {
      subscriptionQuery = subscriptionQuery.where(eq(orgs.subscriptionTier, tier as any));
    }

    // Apply billing due filter
    if (dueWithin) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + dueWithin);
      subscriptionQuery = subscriptionQuery.where(
        sql`DATE_ADD(${orgs.createdAt}, INTERVAL 30 DAY) <= ${dueDate}`
      );
    }

    // Get paginated results
    const allSubscriptions = await subscriptionQuery
      .orderBy(desc(orgs.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    let countQuery = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(orgs);

    if (search) {
      countQuery = countQuery.where(
        or(
          sql`${orgs.name} LIKE ${`%${search}%`}`,
          sql`${orgs.email} LIKE ${`%${search}%`}`
        )
      );
    }

    if (status !== "all") {
      switch (status) {
        case "active":
          countQuery = countQuery.where(eq(orgs.status, "active"));
          break;
        case "trial":
          countQuery = countQuery.where(eq(orgs.status, "pending"));
          break;
        case "expired":
        case "cancelled":
          countQuery = countQuery.where(eq(orgs.status, "suspended"));
          break;
      }
    }

    if (tier !== "all") {
      countQuery = countQuery.where(eq(orgs.subscriptionTier, tier as any));
    }

    const [{ count: totalSubscriptions }] = await countQuery;

    // Calculate analytics
    const analytics = {
      totalSubscriptions,
      activeSubscriptions: allSubscriptions.filter(s => s.subscriptionStatus === "active").length,
      trialSubscriptions: allSubscriptions.filter(s => s.subscriptionStatus === "trial").length,
      cancelledSubscriptions: allSubscriptions.filter(s => s.subscriptionStatus === "cancelled").length,
      totalMonthlyRevenue: allSubscriptions.reduce((sum, s) => 
        s.subscriptionStatus === "active" ? sum + (s.billingAmount || 0) : sum, 0
      ),
      averageUsage: Math.round(
        allSubscriptions.reduce((sum, s) => sum + (s.usageScore || 0), 0) / allSubscriptions.length
      ) || 0,
      // Billing alerts
      upcomingRenewals: allSubscriptions.filter(s => {
        const renewalDate = new Date(s.nextBillingDate);
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        return renewalDate <= nextWeek && s.subscriptionStatus === "active";
      }).length,
      overusageAlerts: allSubscriptions.filter(s => (s.usageScore || 0) > 90).length,
    };

    // Billing alerts
    const alerts = [];
    
    // Payment due alerts
    const paymentDueOrgs = allSubscriptions.filter(s => {
      const dueDate = new Date(s.nextBillingDate);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return dueDate <= tomorrow && s.subscriptionStatus === "active";
    });

    alerts.push(...paymentDueOrgs.map(org => ({
      id: `payment-due-${org.id}`,
      type: "payment_due",
      severity: "high",
      organization: org.orgName,
      message: `Payment due: $${org.billingAmount} due ${new Date(org.nextBillingDate).toLocaleDateString()}`,
      action: "process_payment",
    })));

    // Overusage alerts
    const overusageOrgs = allSubscriptions.filter(s => (s.usageScore || 0) > 90);
    alerts.push(...overusageOrgs.map(org => ({
      id: `overusage-${org.id}`,
      type: "overusage",
      severity: "medium",
      organization: org.orgName,
      message: `Usage at ${org.usageScore}% (${org.currentUsers}/${org.maxUsers} users)`,
      action: "upgrade_plan",
    })));

    // Trial expiring alerts
    const trialExpiringOrgs = allSubscriptions.filter(s => {
      if (s.subscriptionStatus !== "trial") return false;
      const expiryDate = new Date(s.createdAt);
      expiryDate.setDate(expiryDate.getDate() + 14); // 14-day trial
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      return expiryDate <= nextWeek;
    });

    alerts.push(...trialExpiringOrgs.map(org => ({
      id: `trial-expiring-${org.id}`,
      type: "trial_expiring",
      severity: "medium",
      organization: org.orgName,
      message: `Trial expires in ${Math.ceil((new Date(org.createdAt).getTime() + 14*24*60*60*1000 - Date.now()) / (24*60*60*1000))} days`,
      action: "convert_trial",
    })));

    const totalPages = Math.ceil(totalSubscriptions / limit);

    return NextResponse.json({
      subscriptions: allSubscriptions,
      pagination: {
        page,
        limit,
        totalSubscriptions,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      analytics,
      alerts,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}

// Schema for subscription actions
const subscriptionActionSchema = z.object({
  action: z.enum(["pause", "resume", "cancel", "upgrade", "downgrade"]),
  subscriptionIds: z.array(z.number()).min(1),
  newTier: z.enum(["basic", "pro", "enterprise"]).optional(),
});

// POST /api/master-admin/subscriptions - Bulk subscription actions
export async function POST(request: NextRequest) {
  try {
    // TODO: Add master admin authentication check
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.isMasterOwner) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const body = await request.json();
    const { action, subscriptionIds, newTier } = subscriptionActionSchema.parse(body);

    const timestamp = new Date();
    let result;

    switch (action) {
      case "pause":
        // Suspend organizations
        result = await db
          .update(orgs)
          .set({ status: "suspended", updatedAt: timestamp })
          .where(sql`${orgs.id} IN (${subscriptionIds.join(",")})`);
        break;

      case "resume":
        // Reactivate organizations
        result = await db
          .update(orgs)
          .set({ status: "active", updatedAt: timestamp })
          .where(sql`${orgs.id} IN (${subscriptionIds.join(",")})`);
        break;

      case "cancel":
        // Cancel subscriptions (suspend orgs)
        result = await db
          .update(orgs)
          .set({ status: "suspended", updatedAt: timestamp })
          .where(sql`${orgs.id} IN (${subscriptionIds.join(",")})`);
        break;

      case "upgrade":
      case "downgrade":
        if (!newTier) {
          return NextResponse.json(
            { error: "New tier is required for upgrade/downgrade" },
            { status: 400 }
          );
        }

        const maxUsers = newTier === "basic" ? 5 : newTier === "pro" ? 25 : 100;
        
        result = await db
          .update(orgs)
          .set({ 
            subscriptionTier: newTier, 
            maxUsers,
            updatedAt: timestamp 
          })
          .where(sql`${orgs.id} IN (${subscriptionIds.join(",")})`);
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: `Successfully ${action}ed ${subscriptionIds.length} subscriptions`,
      affectedSubscriptions: subscriptionIds.length,
      action,
      ...(newTier && { newTier }),
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error performing subscription action:", error);
    return NextResponse.json(
      { error: "Failed to perform subscription action" },
      { status: 500 }
    );
  }
}