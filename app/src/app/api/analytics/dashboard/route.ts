import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { 
  clients, 
  appointments, 
  files, 
  enhancedMessageTemplates,
  messageDeliveries,
  socialPosts,
  socialAnalytics,
  users
} from "@/db/schema";
import { eq, and, desc, sql, gte, lte, count } from "drizzle-orm";
import { z } from "zod";

// Schema for analytics filtering
const analyticsFilterSchema = z.object({
  timeframe: z.enum(["7d", "30d", "90d", "1y", "all"]).optional().default("30d"),
  dateRange: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
  includeModules: z.array(z.enum(["clients", "appointments", "files", "messages", "social"])).optional().default(["clients", "appointments", "files", "messages", "social"]),
});

// GET /api/analytics/dashboard - Get comprehensive business analytics
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
    const {
      timeframe = "30d",
      dateRange,
      includeModules = ["clients", "appointments", "files", "messages", "social"]
    } = analyticsFilterSchema.parse(Object.fromEntries(searchParams));

    // Calculate date range based on timeframe
    const endDate = dateRange?.end ? new Date(dateRange.end) : new Date();
    let startDate: Date;
    
    if (dateRange?.start) {
      startDate = new Date(dateRange.start);
    } else {
      const now = new Date();
      switch (timeframe) {
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "90d":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case "1y":
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(2020, 0, 1); // All time
      }
    }

    // Gather analytics from all modules
    const analytics: any = {
      overview: {},
      trends: {},
      performance: {},
      insights: [],
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };

    // Get overall business metrics
    analytics.overview = await getBusinessOverview(session.user.orgId, startDate, endDate);

    // Get module-specific analytics
    if (includeModules.includes("clients")) {
      analytics.clients = await getClientAnalytics(session.user.orgId, startDate, endDate);
    }
    
    if (includeModules.includes("appointments")) {
      analytics.appointments = await getAppointmentAnalytics(session.user.orgId, startDate, endDate);
    }
    
    if (includeModules.includes("files")) {
      analytics.files = await getFileAnalytics(session.user.orgId, startDate, endDate);
    }
    
    if (includeModules.includes("messages")) {
      analytics.messages = await getMessageAnalytics(session.user.orgId, startDate, endDate);
    }
    
    if (includeModules.includes("social")) {
      analytics.social = await getSocialAnalytics(session.user.orgId, startDate, endDate);
    }

    // Get trend data for charts
    analytics.trends = await getTrendAnalytics(session.user.orgId, startDate, endDate, timeframe);

    // Generate business insights
    analytics.insights = await generateBusinessInsights(session.user.orgId, startDate, endDate);

    // Get performance metrics
    analytics.performance = await getPerformanceMetrics(session.user.orgId, startDate, endDate);

    return NextResponse.json(analytics);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error fetching dashboard analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

// Helper functions for analytics

async function getBusinessOverview(orgId: number, startDate: Date, endDate: Date) {
  const [overview] = await db
    .select({
      totalClients: sql<number>`(
        SELECT COUNT(*) FROM ${clients} 
        WHERE ${clients.orgId} = ${orgId}
      )`,
      newClients: sql<number>`(
        SELECT COUNT(*) FROM ${clients} 
        WHERE ${clients.orgId} = ${orgId} 
        AND ${clients.createdAt} BETWEEN ${startDate} AND ${endDate}
      )`,
      totalAppointments: sql<number>`(
        SELECT COUNT(*) FROM ${appointments} 
        WHERE ${appointments.orgId} = ${orgId}
        AND ${appointments.dateTime} BETWEEN ${startDate} AND ${endDate}
      )`,
      completedAppointments: sql<number>`(
        SELECT COUNT(*) FROM ${appointments} 
        WHERE ${appointments.orgId} = ${orgId}
        AND ${appointments.status} = 'completed'
        AND ${appointments.dateTime} BETWEEN ${startDate} AND ${endDate}
      )`,
      totalRevenue: sql<number>`(
        SELECT COALESCE(SUM(${appointments.price}), 0) FROM ${appointments} 
        WHERE ${appointments.orgId} = ${orgId}
        AND ${appointments.status} = 'completed'
        AND ${appointments.dateTime} BETWEEN ${startDate} AND ${endDate}
      )`,
      totalFiles: sql<number>`(
        SELECT COUNT(*) FROM ${files} 
        WHERE ${files.orgId} = ${orgId}
        AND ${files.createdAt} BETWEEN ${startDate} AND ${endDate}
      )`,
      messagesSent: sql<number>`(
        SELECT COUNT(*) FROM ${messageDeliveries} 
        WHERE ${messageDeliveries.orgId} = ${orgId}
        AND ${messageDeliveries.status} = 'sent'
        AND ${messageDeliveries.sentAt} BETWEEN ${startDate} AND ${endDate}
      )`,
      socialPosts: sql<number>`(
        SELECT COUNT(*) FROM ${socialPosts} 
        WHERE ${socialPosts.orgId} = ${orgId}
        AND ${socialPosts.publishedAt} BETWEEN ${startDate} AND ${endDate}
      )`,
    })
    .from(clients)
    .limit(1);

  // Calculate growth rates
  const previousPeriodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const previousStartDate = new Date(startDate.getTime() - previousPeriodDays * 24 * 60 * 60 * 1000);
  
  const [previousPeriod] = await db
    .select({
      previousClients: sql<number>`(
        SELECT COUNT(*) FROM ${clients} 
        WHERE ${clients.orgId} = ${orgId} 
        AND ${clients.createdAt} BETWEEN ${previousStartDate} AND ${startDate}
      )`,
      previousAppointments: sql<number>`(
        SELECT COUNT(*) FROM ${appointments} 
        WHERE ${appointments.orgId} = ${orgId}
        AND ${appointments.dateTime} BETWEEN ${previousStartDate} AND ${startDate}
      )`,
      previousRevenue: sql<number>`(
        SELECT COALESCE(SUM(${appointments.price}), 0) FROM ${appointments} 
        WHERE ${appointments.orgId} = ${orgId}
        AND ${appointments.status} = 'completed'
        AND ${appointments.dateTime} BETWEEN ${previousStartDate} AND ${startDate}
      )`,
    })
    .from(clients)
    .limit(1);

  const clientGrowth = previousPeriod.previousClients > 0 
    ? ((overview.newClients - previousPeriod.previousClients) / previousPeriod.previousClients) * 100 
    : 0;
  
  const appointmentGrowth = previousPeriod.previousAppointments > 0 
    ? ((overview.totalAppointments - previousPeriod.previousAppointments) / previousPeriod.previousAppointments) * 100 
    : 0;
  
  const revenueGrowth = previousPeriod.previousRevenue > 0 
    ? ((overview.totalRevenue - previousPeriod.previousRevenue) / previousPeriod.previousRevenue) * 100 
    : 0;

  return {
    ...overview,
    growth: {
      clients: Math.round(clientGrowth * 100) / 100,
      appointments: Math.round(appointmentGrowth * 100) / 100,
      revenue: Math.round(revenueGrowth * 100) / 100,
    },
    metrics: {
      appointmentCompletionRate: overview.totalAppointments > 0 
        ? (overview.completedAppointments / overview.totalAppointments) * 100 
        : 0,
      averageRevenuePerAppointment: overview.completedAppointments > 0 
        ? overview.totalRevenue / overview.completedAppointments 
        : 0,
      filesPerClient: overview.totalClients > 0 
        ? overview.totalFiles / overview.totalClients 
        : 0,
    },
  };
}

async function getClientAnalytics(orgId: number, startDate: Date, endDate: Date) {
  // Client acquisition trends
  const clientTrends = await db
    .select({
      date: sql<string>`DATE(${clients.createdAt})`.as('date'),
      newClients: sql<number>`COUNT(*)`,
    })
    .from(clients)
    .where(
      and(
        eq(clients.orgId, orgId),
        gte(clients.createdAt, startDate),
        lte(clients.createdAt, endDate)
      )
    )
    .groupBy(sql`DATE(${clients.createdAt})`)
    .orderBy(sql`DATE(${clients.createdAt})`);

  // Top referral sources
  const referralSources = await db
    .select({
      source: clients.referralSource,
      count: sql<number>`COUNT(*)`,
    })
    .from(clients)
    .where(
      and(
        eq(clients.orgId, orgId),
        gte(clients.createdAt, startDate),
        lte(clients.createdAt, endDate)
      )
    )
    .groupBy(clients.referralSource)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(10);

  return {
    trends: clientTrends,
    referralSources,
  };
}

async function getAppointmentAnalytics(orgId: number, startDate: Date, endDate: Date) {
  // Appointment status breakdown
  const statusBreakdown = await db
    .select({
      status: appointments.status,
      count: sql<number>`COUNT(*)`,
      revenue: sql<number>`SUM(CASE WHEN ${appointments.status} = 'completed' THEN ${appointments.price} ELSE 0 END)`,
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.orgId, orgId),
        gte(appointments.dateTime, startDate),
        lte(appointments.dateTime, endDate)
      )
    )
    .groupBy(appointments.status);

  // Daily appointment trends
  const appointmentTrends = await db
    .select({
      date: sql<string>`DATE(${appointments.dateTime})`.as('date'),
      appointments: sql<number>`COUNT(*)`,
      revenue: sql<number>`SUM(CASE WHEN ${appointments.status} = 'completed' THEN ${appointments.price} ELSE 0 END)`,
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.orgId, orgId),
        gte(appointments.dateTime, startDate),
        lte(appointments.dateTime, endDate)
      )
    )
    .groupBy(sql`DATE(${appointments.dateTime})`)
    .orderBy(sql`DATE(${appointments.dateTime})`);

  // Popular services
  const popularServices = await db
    .select({
      service: appointments.service,
      count: sql<number>`COUNT(*)`,
      totalRevenue: sql<number>`SUM(CASE WHEN ${appointments.status} = 'completed' THEN ${appointments.price} ELSE 0 END)`,
      avgPrice: sql<number>`AVG(CASE WHEN ${appointments.status} = 'completed' THEN ${appointments.price} ELSE NULL END)`,
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.orgId, orgId),
        gte(appointments.dateTime, startDate),
        lte(appointments.dateTime, endDate)
      )
    )
    .groupBy(appointments.service)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(10);

  return {
    statusBreakdown,
    trends: appointmentTrends,
    popularServices,
  };
}

async function getFileAnalytics(orgId: number, startDate: Date, endDate: Date) {
  const fileStats = await db
    .select({
      type: files.type,
      count: sql<number>`COUNT(*)`,
      totalSize: sql<number>`SUM(CAST(IFNULL(JSON_UNQUOTE(JSON_EXTRACT(${files.metadata}, '$.size')), 0) AS UNSIGNED))`,
    })
    .from(files)
    .where(
      and(
        eq(files.orgId, orgId),
        gte(files.createdAt, startDate),
        lte(files.createdAt, endDate)
      )
    )
    .groupBy(files.type);

  const uploadTrends = await db
    .select({
      date: sql<string>`DATE(${files.createdAt})`.as('date'),
      uploads: sql<number>`COUNT(*)`,
      photos: sql<number>`SUM(CASE WHEN ${files.type} = 'photo' THEN 1 ELSE 0 END)`,
      documents: sql<number>`SUM(CASE WHEN ${files.type} = 'document' THEN 1 ELSE 0 END)`,
    })
    .from(files)
    .where(
      and(
        eq(files.orgId, orgId),
        gte(files.createdAt, startDate),
        lte(files.createdAt, endDate)
      )
    )
    .groupBy(sql`DATE(${files.createdAt})`)
    .orderBy(sql`DATE(${files.createdAt})`);

  return {
    typeBreakdown: fileStats,
    uploadTrends,
  };
}

async function getMessageAnalytics(orgId: number, startDate: Date, endDate: Date) {
  const messageStats = await db
    .select({
      channel: messageDeliveries.channel,
      total: sql<number>`COUNT(*)`,
      successful: sql<number>`SUM(CASE WHEN ${messageDeliveries.status} = 'sent' THEN 1 ELSE 0 END)`,
      failed: sql<number>`SUM(CASE WHEN ${messageDeliveries.status} = 'failed' THEN 1 ELSE 0 END)`,
    })
    .from(messageDeliveries)
    .where(
      and(
        eq(messageDeliveries.orgId, orgId),
        gte(messageDeliveries.createdAt, startDate),
        lte(messageDeliveries.createdAt, endDate)
      )
    )
    .groupBy(messageDeliveries.channel);

  const templateUsage = await db
    .select({
      templateName: enhancedMessageTemplates.name,
      usageCount: enhancedMessageTemplates.usageCount,
      type: enhancedMessageTemplates.type,
    })
    .from(enhancedMessageTemplates)
    .where(eq(enhancedMessageTemplates.orgId, orgId))
    .orderBy(desc(enhancedMessageTemplates.usageCount))
    .limit(10);

  return {
    channelPerformance: messageStats,
    topTemplates: templateUsage,
  };
}

async function getSocialAnalytics(orgId: number, startDate: Date, endDate: Date) {
  const socialStats = await db
    .select({
      totalPosts: sql<number>`COUNT(DISTINCT ${socialPosts.id})`,
      totalEngagement: sql<number>`SUM(${socialAnalytics.engagement})`,
      totalViews: sql<number>`SUM(${socialAnalytics.views})`,
      totalLikes: sql<number>`SUM(${socialAnalytics.likes})`,
    })
    .from(socialPosts)
    .leftJoin(socialAnalytics, eq(socialPosts.id, socialAnalytics.postId))
    .where(
      and(
        eq(socialPosts.orgId, orgId),
        gte(socialPosts.publishedAt, startDate),
        lte(socialPosts.publishedAt, endDate)
      )
    );

  const platformPerformance = await db
    .select({
      platform: socialAnalytics.platform,
      posts: sql<number>`COUNT(DISTINCT ${socialAnalytics.postId})`,
      engagement: sql<number>`SUM(${socialAnalytics.engagement})`,
      avgEngagement: sql<number>`AVG(${socialAnalytics.engagement})`,
    })
    .from(socialAnalytics)
    .innerJoin(socialPosts, eq(socialAnalytics.postId, socialPosts.id))
    .where(
      and(
        eq(socialPosts.orgId, orgId),
        gte(socialAnalytics.collectedAt, startDate),
        lte(socialAnalytics.collectedAt, endDate)
      )
    )
    .groupBy(socialAnalytics.platform);

  return {
    overview: socialStats[0] || { totalPosts: 0, totalEngagement: 0, totalViews: 0, totalLikes: 0 },
    platformPerformance,
  };
}

async function getTrendAnalytics(orgId: number, startDate: Date, endDate: Date, timeframe: string) {
  const groupBy = timeframe === "7d" ? "DATE" : timeframe === "30d" ? "DATE" : "WEEK";
  
  const trends = await db
    .select({
      period: sql<string>`${sql.raw(groupBy)}(${clients.createdAt})`.as('period'),
      newClients: sql<number>`COUNT(DISTINCT ${clients.id})`,
      appointments: sql<number>`COUNT(DISTINCT ${appointments.id})`,
      revenue: sql<number>`SUM(CASE WHEN ${appointments.status} = 'completed' THEN ${appointments.price} ELSE 0 END)`,
      messagesSent: sql<number>`COUNT(DISTINCT ${messageDeliveries.id})`,
    })
    .from(clients)
    .leftJoin(appointments, and(
      eq(clients.orgId, appointments.orgId),
      gte(appointments.dateTime, startDate),
      lte(appointments.dateTime, endDate)
    ))
    .leftJoin(messageDeliveries, and(
      eq(clients.orgId, messageDeliveries.orgId),
      gte(messageDeliveries.createdAt, startDate),
      lte(messageDeliveries.createdAt, endDate)
    ))
    .where(eq(clients.orgId, orgId))
    .groupBy(sql`${sql.raw(groupBy)}(${clients.createdAt})`)
    .orderBy(sql`${sql.raw(groupBy)}(${clients.createdAt})`);

  return trends;
}

async function generateBusinessInsights(orgId: number, startDate: Date, endDate: Date) {
  const insights = [];

  // Check appointment completion rate
  const [appointmentStats] = await db
    .select({
      total: sql<number>`COUNT(*)`,
      completed: sql<number>`SUM(CASE WHEN ${appointments.status} = 'completed' THEN 1 ELSE 0 END)`,
      cancelled: sql<number>`SUM(CASE WHEN ${appointments.status} = 'cancelled' THEN 1 ELSE 0 END)`,
      noShow: sql<number>`SUM(CASE WHEN ${appointments.status} = 'no_show' THEN 1 ELSE 0 END)`,
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.orgId, orgId),
        gte(appointments.dateTime, startDate),
        lte(appointments.dateTime, endDate)
      )
    );

  if (appointmentStats.total > 0) {
    const completionRate = (appointmentStats.completed / appointmentStats.total) * 100;
    const noShowRate = (appointmentStats.noShow / appointmentStats.total) * 100;
    
    if (completionRate < 80) {
      insights.push({
        type: "warning",
        title: "Low Appointment Completion Rate",
        description: `Only ${completionRate.toFixed(1)}% of appointments are being completed. Consider implementing reminder systems.`,
        metric: completionRate,
        action: "Improve reminder system",
      });
    }
    
    if (noShowRate > 15) {
      insights.push({
        type: "alert",
        title: "High No-Show Rate",
        description: `${noShowRate.toFixed(1)}% of appointments result in no-shows. Consider requiring deposits or confirmation calls.`,
        metric: noShowRate,
        action: "Implement deposit system",
      });
    }
  }

  // Check client retention
  const [clientRetention] = await db
    .select({
      newClients: sql<number>`COUNT(DISTINCT CASE WHEN ${clients.createdAt} BETWEEN ${startDate} AND ${endDate} THEN ${clients.id} END)`,
      returningClients: sql<number>`COUNT(DISTINCT CASE WHEN ${appointments.dateTime} BETWEEN ${startDate} AND ${endDate} AND ${clients.createdAt} < ${startDate} THEN ${clients.id} END)`,
    })
    .from(clients)
    .leftJoin(appointments, eq(clients.id, appointments.clientId))
    .where(eq(clients.orgId, orgId));

  if (clientRetention.newClients > clientRetention.returningClients) {
    insights.push({
      type: "opportunity",
      title: "Focus on Client Retention",
      description: "You have more new clients than returning clients. Implement follow-up workflows to improve retention.",
      metric: clientRetention.returningClients / (clientRetention.newClients + clientRetention.returningClients) * 100,
      action: "Create follow-up workflows",
    });
  }

  return insights;
}

async function getPerformanceMetrics(orgId: number, startDate: Date, endDate: Date) {
  const [metrics] = await db
    .select({
      // User activity
      activeUsers: sql<number>`COUNT(DISTINCT ${users.id})`,
      
      // System health
      totalRecords: sql<number>`(
        SELECT COUNT(*) FROM ${clients} WHERE ${clients.orgId} = ${orgId}
      ) + (
        SELECT COUNT(*) FROM ${appointments} WHERE ${appointments.orgId} = ${orgId}
      ) + (
        SELECT COUNT(*) FROM ${files} WHERE ${files.orgId} = ${orgId}
      )`,
      
      // Data quality
      clientsWithPhone: sql<number>`(
        SELECT COUNT(*) FROM ${clients} 
        WHERE ${clients.orgId} = ${orgId} 
        AND JSON_LENGTH(${clients.phones}) > 0
      )`,
      
      totalClients: sql<number>`(
        SELECT COUNT(*) FROM ${clients} WHERE ${clients.orgId} = ${orgId}
      )`,
    })
    .from(users)
    .where(
      and(
        eq(users.orgId, orgId),
        eq(users.isActive, true)
      )
    );

  const dataQualityScore = metrics.totalClients > 0 
    ? (metrics.clientsWithPhone / metrics.totalClients) * 100 
    : 0;

  return {
    ...metrics,
    dataQualityScore: Math.round(dataQualityScore),
    systemHealth: "healthy", // TODO: Implement actual health checks
  };
}