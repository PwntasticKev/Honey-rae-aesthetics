import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { socialPosts, socialPlatforms, socialAnalytics, users } from "@/db/schema";
import { eq, and, desc, like, or, sql, gte, lte, inArray } from "drizzle-orm";
import { z } from "zod";

// Schema for creating a new social media post
const createPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  mediaUrls: z.array(z.string().url()).optional().default([]),
  platforms: z.array(z.enum(["instagram", "facebook", "tiktok", "youtube"])).min(1, "At least one platform is required"),
  scheduledAt: z.string().datetime("Invalid scheduled date"),
  publishImmediately: z.boolean().optional().default(false),
});

// Schema for post filtering
const postFilterSchema = z.object({
  status: z.enum(["all", "draft", "scheduled", "published", "failed", "cancelled"]).optional().default("all"),
  platform: z.enum(["all", "instagram", "facebook", "tiktok", "youtube"]).optional().default("all"),
  dateRange: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
  search: z.string().optional(),
  createdBy: z.number().optional(),
  sortBy: z.enum(["newest", "oldest", "scheduled", "engagement"]).default("newest"),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
});

// GET /api/social/posts - Get social media posts with filtering
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
      status = "all",
      platform = "all",
      dateRange,
      search = "",
      createdBy,
      sortBy = "newest",
      page = 1,
      limit = 20
    } = postFilterSchema.parse(Object.fromEntries(searchParams));

    const offset = (page - 1) * limit;

    // Build dynamic query for posts with creator details
    let postsQuery = db
      .select({
        id: socialPosts.id,
        title: socialPosts.title,
        content: socialPosts.content,
        mediaUrls: socialPosts.mediaUrls,
        platforms: socialPosts.platforms,
        status: socialPosts.status,
        scheduledAt: socialPosts.scheduledAt,
        publishedAt: socialPosts.publishedAt,
        platformPostIds: socialPosts.platformPostIds,
        errorMessage: socialPosts.errorMessage,
        createdAt: socialPosts.createdAt,
        updatedAt: socialPosts.updatedAt,
        // Creator details
        createdByName: users.name,
        createdByEmail: users.email,
        // Analytics summary
        totalLikes: sql<number>`(
          SELECT COALESCE(SUM(${socialAnalytics.likes}), 0) 
          FROM ${socialAnalytics} 
          WHERE ${socialAnalytics.postId} = ${socialPosts.id}
        )`.as('totalLikes'),
        totalComments: sql<number>`(
          SELECT COALESCE(SUM(${socialAnalytics.comments}), 0) 
          FROM ${socialAnalytics} 
          WHERE ${socialAnalytics.postId} = ${socialPosts.id}
        )`.as('totalComments'),
        totalShares: sql<number>`(
          SELECT COALESCE(SUM(${socialAnalytics.shares}), 0) 
          FROM ${socialAnalytics} 
          WHERE ${socialAnalytics.postId} = ${socialPosts.id}
        )`.as('totalShares'),
        totalViews: sql<number>`(
          SELECT COALESCE(SUM(${socialAnalytics.views}), 0) 
          FROM ${socialAnalytics} 
          WHERE ${socialAnalytics.postId} = ${socialPosts.id}
        )`.as('totalViews'),
        totalEngagement: sql<number>`(
          SELECT COALESCE(SUM(${socialAnalytics.engagement}), 0) 
          FROM ${socialAnalytics} 
          WHERE ${socialAnalytics.postId} = ${socialPosts.id}
        )`.as('totalEngagement'),
      })
      .from(socialPosts)
      .leftJoin(users, eq(socialPosts.createdBy, users.id))
      .where(eq(socialPosts.orgId, session.user.orgId));

    // Apply status filter
    if (status !== "all") {
      postsQuery = postsQuery.where(eq(socialPosts.status, status));
    }

    // Apply platform filter
    if (platform !== "all") {
      postsQuery = postsQuery.where(
        sql`JSON_CONTAINS(${socialPosts.platforms}, JSON_QUOTE(${platform}))`
      );
    }

    // Apply date range filter
    if (dateRange?.start && dateRange?.end) {
      postsQuery = postsQuery.where(
        and(
          gte(socialPosts.scheduledAt, new Date(dateRange.start)),
          lte(socialPosts.scheduledAt, new Date(dateRange.end))
        )
      );
    }

    // Apply search filter
    if (search) {
      postsQuery = postsQuery.where(
        or(
          like(socialPosts.title, `%${search}%`),
          like(socialPosts.content, `%${search}%`),
          like(users.name, `%${search}%`)
        )
      );
    }

    // Apply creator filter
    if (createdBy) {
      postsQuery = postsQuery.where(eq(socialPosts.createdBy, createdBy));
    }

    // Apply sorting
    switch (sortBy) {
      case "newest":
        postsQuery = postsQuery.orderBy(desc(socialPosts.createdAt));
        break;
      case "oldest":
        postsQuery = postsQuery.orderBy(socialPosts.createdAt);
        break;
      case "scheduled":
        postsQuery = postsQuery.orderBy(socialPosts.scheduledAt);
        break;
      case "engagement":
        postsQuery = postsQuery.orderBy(desc(sql`(
          SELECT COALESCE(SUM(${socialAnalytics.engagement}), 0) 
          FROM ${socialAnalytics} 
          WHERE ${socialAnalytics.postId} = ${socialPosts.id}
        )`));
        break;
    }

    // Get paginated results
    const posts = await postsQuery
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    let countQuery = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(socialPosts)
      .leftJoin(users, eq(socialPosts.createdBy, users.id))
      .where(eq(socialPosts.orgId, session.user.orgId));

    // Apply same filters to count query
    if (status !== "all") {
      countQuery = countQuery.where(eq(socialPosts.status, status));
    }

    if (platform !== "all") {
      countQuery = countQuery.where(
        sql`JSON_CONTAINS(${socialPosts.platforms}, JSON_QUOTE(${platform}))`
      );
    }

    if (dateRange?.start && dateRange?.end) {
      countQuery = countQuery.where(
        and(
          gte(socialPosts.scheduledAt, new Date(dateRange.start)),
          lte(socialPosts.scheduledAt, new Date(dateRange.end))
        )
      );
    }

    if (search) {
      countQuery = countQuery.where(
        or(
          like(socialPosts.title, `%${search}%`),
          like(socialPosts.content, `%${search}%`),
          like(users.name, `%${search}%`)
        )
      );
    }

    if (createdBy) {
      countQuery = countQuery.where(eq(socialPosts.createdBy, createdBy));
    }

    const [{ count: totalPosts }] = await countQuery;

    // Calculate analytics
    const analytics = await getPostAnalytics(session.user.orgId);

    const totalPages = Math.ceil(totalPosts / limit);

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        totalPosts,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      analytics,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error fetching social posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch social posts" },
      { status: 500 }
    );
  }
}

// POST /api/social/posts - Create a new social media post
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
    const validatedData = createPostSchema.parse(body);

    // Verify that all selected platforms are connected
    const connectedPlatforms = await db
      .select({ platform: socialPlatforms.platform })
      .from(socialPlatforms)
      .where(
        and(
          eq(socialPlatforms.orgId, session.user.orgId),
          eq(socialPlatforms.isActive, true),
          inArray(socialPlatforms.platform, validatedData.platforms)
        )
      );

    const connectedPlatformNames = connectedPlatforms.map(p => p.platform);
    const missingPlatforms = validatedData.platforms.filter(p => !connectedPlatformNames.includes(p));

    if (missingPlatforms.length > 0) {
      return NextResponse.json(
        { 
          error: "Some platforms are not connected", 
          missingPlatforms 
        },
        { status: 400 }
      );
    }

    // Determine post status
    const scheduledDate = new Date(validatedData.scheduledAt);
    const now = new Date();
    const isImmediate = validatedData.publishImmediately || scheduledDate <= now;
    
    const status = isImmediate ? "published" : "scheduled";

    // Create new post
    const newPost = await db.insert(socialPosts).values({
      orgId: session.user.orgId,
      title: validatedData.title,
      content: validatedData.content,
      mediaUrls: validatedData.mediaUrls,
      platforms: validatedData.platforms,
      scheduledAt: scheduledDate,
      status: status,
      publishedAt: isImmediate ? now : undefined,
      createdBy: session.user.id,
      createdAt: now,
      updatedAt: now,
    });

    // If publishing immediately, simulate posting to platforms
    if (isImmediate) {
      const platformResults = await Promise.allSettled(
        validatedData.platforms.map(platform => 
          simulatePostToplatform(platform, validatedData.content, validatedData.mediaUrls)
        )
      );

      // Update post with platform post IDs
      const platformPostIds: Record<string, string> = {};
      platformResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          platformPostIds[validatedData.platforms[index]] = result.value.postId;
        }
      });

      await db
        .update(socialPosts)
        .set({
          platformPostIds,
          updatedAt: now,
        })
        .where(eq(socialPosts.id, newPost.insertId as number));
    }

    // Get the created post with full details
    const createdPost = await db
      .select({
        id: socialPosts.id,
        title: socialPosts.title,
        content: socialPosts.content,
        platforms: socialPosts.platforms,
        status: socialPosts.status,
        scheduledAt: socialPosts.scheduledAt,
        createdByName: users.name,
        createdAt: socialPosts.createdAt,
      })
      .from(socialPosts)
      .leftJoin(users, eq(socialPosts.createdBy, users.id))
      .where(eq(socialPosts.id, newPost.insertId as number))
      .limit(1);

    return NextResponse.json({
      message: "Post created successfully",
      post: createdPost[0],
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}

// Helper function to get post analytics
async function getPostAnalytics(orgId: number) {
  const [stats] = await db
    .select({
      totalPosts: sql<number>`COUNT(*)`,
      publishedPosts: sql<number>`SUM(CASE WHEN ${socialPosts.status} = 'published' THEN 1 ELSE 0 END)`,
      scheduledPosts: sql<number>`SUM(CASE WHEN ${socialPosts.status} = 'scheduled' THEN 1 ELSE 0 END)`,
      draftPosts: sql<number>`SUM(CASE WHEN ${socialPosts.status} = 'draft' THEN 1 ELSE 0 END)`,
      failedPosts: sql<number>`SUM(CASE WHEN ${socialPosts.status} = 'failed' THEN 1 ELSE 0 END)`,
    })
    .from(socialPosts)
    .where(eq(socialPosts.orgId, orgId));

  // Get platform breakdown
  const platformBreakdown = await db
    .select({
      platform: sql<string>`JSON_UNQUOTE(JSON_EXTRACT(${socialPosts.platforms}, '$[0]'))`.as('platform'),
      count: sql<number>`COUNT(*)`,
    })
    .from(socialPosts)
    .where(eq(socialPosts.orgId, orgId))
    .groupBy(sql`JSON_UNQUOTE(JSON_EXTRACT(${socialPosts.platforms}, '$[0]'))`)
    .orderBy(sql`COUNT(*) DESC`);

  // Get recent performance
  const recentPosts = await db
    .select({
      id: socialPosts.id,
      title: socialPosts.title,
      platforms: socialPosts.platforms,
      publishedAt: socialPosts.publishedAt,
      totalEngagement: sql<number>`(
        SELECT COALESCE(SUM(${socialAnalytics.engagement}), 0) 
        FROM ${socialAnalytics} 
        WHERE ${socialAnalytics.postId} = ${socialPosts.id}
      )`.as('totalEngagement'),
    })
    .from(socialPosts)
    .where(
      and(
        eq(socialPosts.orgId, orgId),
        eq(socialPosts.status, "published")
      )
    )
    .orderBy(desc(socialPosts.publishedAt))
    .limit(5);

  return {
    overview: stats,
    platformBreakdown: platformBreakdown.reduce((acc, item) => {
      acc[item.platform || 'unknown'] = item.count;
      return acc;
    }, {} as Record<string, number>),
    topPerformingPosts: recentPosts,
  };
}

// Simulate posting to social media platforms
async function simulatePostToplatform(platform: string, content: string, mediaUrls: string[]) {
  // TODO: Replace with actual platform API calls
  // For development, we'll simulate posting
  
  const mockPostId = `${platform}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  // Simulate posting delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate 95% success rate
  const success = Math.random() > 0.05;
  
  if (success) {
    return {
      success: true,
      postId: mockPostId,
      platform,
    };
  } else {
    throw new Error(`Failed to post to ${platform}`);
  }
}