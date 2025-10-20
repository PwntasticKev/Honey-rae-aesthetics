import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { socialAnalytics, socialPosts, socialPlatforms } from "@/db/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { z } from "zod";

// Schema for analytics filtering
const analyticsFilterSchema = z.object({
  platform: z.enum(["all", "instagram", "facebook", "tiktok", "youtube"]).optional().default("all"),
  dateRange: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
  postId: z.number().optional(),
  metric: z.enum(["all", "likes", "comments", "shares", "views", "engagement"]).optional().default("all"),
});

// GET /api/social/analytics - Get social media analytics
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
      platform = "all",
      dateRange,
      postId,
      metric = "all"
    } = analyticsFilterSchema.parse(Object.fromEntries(searchParams));

    // Set default date range if not provided (last 30 days)
    const endDate = dateRange?.end ? new Date(dateRange.end) : new Date();
    const startDate = dateRange?.start ? new Date(dateRange.start) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get overall analytics summary
    const overallAnalytics = await getOverallAnalytics(session.user.orgId, startDate, endDate, platform);

    // Get platform-specific analytics
    const platformAnalytics = await getPlatformAnalytics(session.user.orgId, startDate, endDate);

    // Get top performing posts
    const topPosts = await getTopPerformingPosts(session.user.orgId, startDate, endDate, platform);

    // Get engagement trends (daily breakdown)
    const engagementTrends = await getEngagementTrends(session.user.orgId, startDate, endDate, platform);

    // Get specific post analytics if requested
    let postAnalytics = null;
    if (postId) {
      postAnalytics = await getPostAnalytics(session.user.orgId, postId);
    }

    return NextResponse.json({
      overview: overallAnalytics,
      platformBreakdown: platformAnalytics,
      topPerformingPosts: topPosts,
      engagementTrends,
      postAnalytics,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

// POST /api/social/analytics - Update analytics data (webhook or manual refresh)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // This endpoint would be used to refresh analytics data from platforms
    // For now, we'll simulate collecting analytics for all published posts
    
    const publishedPosts = await db
      .select({
        id: socialPosts.id,
        platforms: socialPosts.platforms,
        platformPostIds: socialPosts.platformPostIds,
        publishedAt: socialPosts.publishedAt,
      })
      .from(socialPosts)
      .where(
        and(
          eq(socialPosts.orgId, session.user.orgId),
          eq(socialPosts.status, "published")
        )
      );

    const analyticsUpdates = [];

    for (const post of publishedPosts) {
      if (!post.platformPostIds) continue;

      const platformPostIds = post.platformPostIds as Record<string, string>;
      
      for (const [platform, platformPostId] of Object.entries(platformPostIds)) {
        // Simulate fetching analytics from platform API
        const analytics = await simulateAnalyticsCollection(platform, platformPostId);
        
        // Check if analytics already exist for this post and platform
        const existingAnalytics = await db
          .select()
          .from(socialAnalytics)
          .where(
            and(
              eq(socialAnalytics.postId, post.id),
              eq(socialAnalytics.platform, platform)
            )
          )
          .limit(1);

        if (existingAnalytics.length > 0) {
          // Update existing analytics
          await db
            .update(socialAnalytics)
            .set({
              likes: analytics.likes,
              comments: analytics.comments,
              shares: analytics.shares,
              views: analytics.views,
              engagement: analytics.engagement,
              collectedAt: new Date(),
            })
            .where(eq(socialAnalytics.id, existingAnalytics[0].id));
        } else {
          // Create new analytics record
          await db.insert(socialAnalytics).values({
            orgId: session.user.orgId,
            postId: post.id,
            platform: platform,
            platformPostId: platformPostId,
            likes: analytics.likes,
            comments: analytics.comments,
            shares: analytics.shares,
            views: analytics.views,
            engagement: analytics.engagement,
            collectedAt: new Date(),
          });
        }

        analyticsUpdates.push({
          postId: post.id,
          platform,
          analytics,
        });
      }
    }

    return NextResponse.json({
      message: "Analytics updated successfully",
      updatedPosts: analyticsUpdates.length,
      updates: analyticsUpdates,
    });

  } catch (error) {
    console.error("Error updating analytics:", error);
    return NextResponse.json(
      { error: "Failed to update analytics" },
      { status: 500 }
    );
  }
}

// Helper functions for analytics queries

async function getOverallAnalytics(orgId: number, startDate: Date, endDate: Date, platform: string) {
  let analyticsQuery = db
    .select({
      totalLikes: sql<number>`SUM(${socialAnalytics.likes})`,
      totalComments: sql<number>`SUM(${socialAnalytics.comments})`,
      totalShares: sql<number>`SUM(${socialAnalytics.shares})`,
      totalViews: sql<number>`SUM(${socialAnalytics.views})`,
      totalEngagement: sql<number>`SUM(${socialAnalytics.engagement})`,
      totalPosts: sql<number>`COUNT(DISTINCT ${socialAnalytics.postId})`,
      avgEngagementPerPost: sql<number>`AVG(${socialAnalytics.engagement})`,
    })
    .from(socialAnalytics)
    .innerJoin(socialPosts, eq(socialAnalytics.postId, socialPosts.id))
    .where(
      and(
        eq(socialPosts.orgId, orgId),
        gte(socialAnalytics.collectedAt, startDate),
        lte(socialAnalytics.collectedAt, endDate)
      )
    );

  if (platform !== "all") {
    analyticsQuery = analyticsQuery.where(eq(socialAnalytics.platform, platform));
  }

  const [result] = await analyticsQuery;
  
  return {
    totalLikes: result?.totalLikes || 0,
    totalComments: result?.totalComments || 0,
    totalShares: result?.totalShares || 0,
    totalViews: result?.totalViews || 0,
    totalEngagement: result?.totalEngagement || 0,
    totalPosts: result?.totalPosts || 0,
    avgEngagementPerPost: Math.round(result?.avgEngagementPerPost || 0),
    engagementRate: result?.totalViews ? ((result?.totalEngagement || 0) / (result?.totalViews || 1) * 100).toFixed(2) : "0.00",
  };
}

async function getPlatformAnalytics(orgId: number, startDate: Date, endDate: Date) {
  const platformStats = await db
    .select({
      platform: socialAnalytics.platform,
      totalLikes: sql<number>`SUM(${socialAnalytics.likes})`,
      totalComments: sql<number>`SUM(${socialAnalytics.comments})`,
      totalShares: sql<number>`SUM(${socialAnalytics.shares})`,
      totalViews: sql<number>`SUM(${socialAnalytics.views})`,
      totalEngagement: sql<number>`SUM(${socialAnalytics.engagement})`,
      postCount: sql<number>`COUNT(DISTINCT ${socialAnalytics.postId})`,
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
    .groupBy(socialAnalytics.platform)
    .orderBy(desc(sql`SUM(${socialAnalytics.engagement})`));

  return platformStats.map(stat => ({
    platform: stat.platform,
    metrics: {
      likes: stat.totalLikes,
      comments: stat.totalComments,
      shares: stat.totalShares,
      views: stat.totalViews,
      engagement: stat.totalEngagement,
      posts: stat.postCount,
      avgEngagementPerPost: stat.postCount ? Math.round(stat.totalEngagement / stat.postCount) : 0,
    },
  }));
}

async function getTopPerformingPosts(orgId: number, startDate: Date, endDate: Date, platform: string) {
  let topPostsQuery = db
    .select({
      postId: socialAnalytics.postId,
      title: socialPosts.title,
      content: socialPosts.content,
      platforms: socialPosts.platforms,
      publishedAt: socialPosts.publishedAt,
      totalLikes: sql<number>`SUM(${socialAnalytics.likes})`,
      totalComments: sql<number>`SUM(${socialAnalytics.comments})`,
      totalShares: sql<number>`SUM(${socialAnalytics.shares})`,
      totalViews: sql<number>`SUM(${socialAnalytics.views})`,
      totalEngagement: sql<number>`SUM(${socialAnalytics.engagement})`,
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
    .groupBy(socialAnalytics.postId)
    .orderBy(desc(sql`SUM(${socialAnalytics.engagement})`))
    .limit(10);

  if (platform !== "all") {
    topPostsQuery = topPostsQuery.where(eq(socialAnalytics.platform, platform));
  }

  return await topPostsQuery;
}

async function getEngagementTrends(orgId: number, startDate: Date, endDate: Date, platform: string) {
  let trendsQuery = db
    .select({
      date: sql<string>`DATE(${socialAnalytics.collectedAt})`.as('date'),
      likes: sql<number>`SUM(${socialAnalytics.likes})`,
      comments: sql<number>`SUM(${socialAnalytics.comments})`,
      shares: sql<number>`SUM(${socialAnalytics.shares})`,
      views: sql<number>`SUM(${socialAnalytics.views})`,
      engagement: sql<number>`SUM(${socialAnalytics.engagement})`,
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
    .groupBy(sql`DATE(${socialAnalytics.collectedAt})`)
    .orderBy(sql`DATE(${socialAnalytics.collectedAt})`);

  if (platform !== "all") {
    trendsQuery = trendsQuery.where(eq(socialAnalytics.platform, platform));
  }

  return await trendsQuery;
}

async function getPostAnalytics(orgId: number, postId: number) {
  const postAnalytics = await db
    .select({
      platform: socialAnalytics.platform,
      platformPostId: socialAnalytics.platformPostId,
      likes: socialAnalytics.likes,
      comments: socialAnalytics.comments,
      shares: socialAnalytics.shares,
      views: socialAnalytics.views,
      engagement: socialAnalytics.engagement,
      collectedAt: socialAnalytics.collectedAt,
    })
    .from(socialAnalytics)
    .innerJoin(socialPosts, eq(socialAnalytics.postId, socialPosts.id))
    .where(
      and(
        eq(socialPosts.orgId, orgId),
        eq(socialAnalytics.postId, postId)
      )
    )
    .orderBy(socialAnalytics.platform);

  return postAnalytics;
}

// Simulate analytics collection from platforms
async function simulateAnalyticsCollection(platform: string, platformPostId: string) {
  // TODO: Replace with actual platform API calls
  // For development, simulate realistic engagement metrics
  
  const baseMetrics = {
    instagram: { likes: 100, comments: 15, shares: 5, views: 500 },
    facebook: { likes: 50, comments: 10, shares: 20, views: 300 },
    tiktok: { likes: 200, comments: 30, shares: 10, views: 2000 },
    youtube: { likes: 75, comments: 25, shares: 8, views: 1500 },
  };

  const base = baseMetrics[platform as keyof typeof baseMetrics] || baseMetrics.instagram;
  
  // Add some randomization to simulate real growth
  const variation = 0.2; // 20% variation
  
  const likes = Math.round(base.likes * (1 + (Math.random() - 0.5) * variation));
  const comments = Math.round(base.comments * (1 + (Math.random() - 0.5) * variation));
  const shares = Math.round(base.shares * (1 + (Math.random() - 0.5) * variation));
  const views = Math.round(base.views * (1 + (Math.random() - 0.5) * variation));
  const engagement = likes + comments + shares;

  return {
    likes: Math.max(0, likes),
    comments: Math.max(0, comments),
    shares: Math.max(0, shares),
    views: Math.max(0, views),
    engagement: Math.max(0, engagement),
  };
}