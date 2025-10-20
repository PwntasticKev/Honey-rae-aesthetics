import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { socialPlatforms, users } from "@/db/schema";
import { eq, and, desc, like, or, sql } from "drizzle-orm";
import { z } from "zod";

// Schema for connecting a social platform
const connectPlatformSchema = z.object({
  platform: z.enum(["instagram", "facebook", "tiktok", "youtube"]),
  accountName: z.string().min(1, "Account name is required"),
  accountId: z.string().min(1, "Account ID is required"),
  accessToken: z.string().min(1, "Access token is required"),
  refreshToken: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});

// Schema for platform filtering
const platformFilterSchema = z.object({
  platform: z.enum(["all", "instagram", "facebook", "tiktok", "youtube"]).optional().default("all"),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
});

// GET /api/social/platforms - Get connected social media platforms
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
      isActive,
      search = "",
    } = platformFilterSchema.parse(Object.fromEntries(searchParams));

    // Build query for connected platforms
    let platformsQuery = db
      .select({
        id: socialPlatforms.id,
        platform: socialPlatforms.platform,
        accountName: socialPlatforms.accountName,
        accountId: socialPlatforms.accountId,
        isActive: socialPlatforms.isActive,
        expiresAt: socialPlatforms.expiresAt,
        metadata: socialPlatforms.metadata,
        createdAt: socialPlatforms.createdAt,
        updatedAt: socialPlatforms.updatedAt,
        // Token status
        hasValidToken: sql<boolean>`${socialPlatforms.accessToken} IS NOT NULL AND ${socialPlatforms.accessToken} != ''`.as('hasValidToken'),
        isExpired: sql<boolean>`${socialPlatforms.expiresAt} IS NOT NULL AND ${socialPlatforms.expiresAt} < NOW()`.as('isExpired'),
      })
      .from(socialPlatforms)
      .where(eq(socialPlatforms.orgId, session.user.orgId));

    // Apply platform filter
    if (platform !== "all") {
      platformsQuery = platformsQuery.where(eq(socialPlatforms.platform, platform));
    }

    // Apply active status filter
    if (isActive !== undefined) {
      platformsQuery = platformsQuery.where(eq(socialPlatforms.isActive, isActive));
    }

    // Apply search filter
    if (search) {
      platformsQuery = platformsQuery.where(
        or(
          like(socialPlatforms.accountName, `%${search}%`),
          like(socialPlatforms.accountId, `%${search}%`)
        )
      );
    }

    const platforms = await platformsQuery.orderBy(desc(socialPlatforms.createdAt));

    // Get platform statistics
    const [stats] = await db
      .select({
        totalPlatforms: sql<number>`COUNT(*)`,
        activePlatforms: sql<number>`SUM(CASE WHEN ${socialPlatforms.isActive} = 1 THEN 1 ELSE 0 END)`,
        expiredTokens: sql<number>`SUM(CASE WHEN ${socialPlatforms.expiresAt} IS NOT NULL AND ${socialPlatforms.expiresAt} < NOW() THEN 1 ELSE 0 END)`,
        instagramAccounts: sql<number>`SUM(CASE WHEN ${socialPlatforms.platform} = 'instagram' THEN 1 ELSE 0 END)`,
        facebookAccounts: sql<number>`SUM(CASE WHEN ${socialPlatforms.platform} = 'facebook' THEN 1 ELSE 0 END)`,
        tiktokAccounts: sql<number>`SUM(CASE WHEN ${socialPlatforms.platform} = 'tiktok' THEN 1 ELSE 0 END)`,
        youtubeAccounts: sql<number>`SUM(CASE WHEN ${socialPlatforms.platform} = 'youtube' THEN 1 ELSE 0 END)`,
      })
      .from(socialPlatforms)
      .where(eq(socialPlatforms.orgId, session.user.orgId));

    // Get platform health status
    const platformHealth = {
      healthy: platforms.filter(p => p.isActive && !p.isExpired).length,
      expiredTokens: platforms.filter(p => p.isExpired).length,
      inactive: platforms.filter(p => !p.isActive).length,
      needsAttention: platforms.filter(p => p.isActive && (p.isExpired || !p.hasValidToken)).length,
    };

    return NextResponse.json({
      platforms,
      analytics: {
        overview: stats,
        health: platformHealth,
        byPlatform: {
          instagram: stats.instagramAccounts,
          facebook: stats.facebookAccounts,
          tiktok: stats.tiktokAccounts,
          youtube: stats.youtubeAccounts,
        },
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error fetching social platforms:", error);
    return NextResponse.json(
      { error: "Failed to fetch social platforms" },
      { status: 500 }
    );
  }
}

// POST /api/social/platforms - Connect a new social media platform
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = connectPlatformSchema.parse(body);

    // Check if platform is already connected for this org
    const existingPlatform = await db
      .select()
      .from(socialPlatforms)
      .where(
        and(
          eq(socialPlatforms.orgId, session.user.orgId),
          eq(socialPlatforms.platform, validatedData.platform),
          eq(socialPlatforms.accountId, validatedData.accountId)
        )
      )
      .limit(1);

    if (existingPlatform.length > 0) {
      return NextResponse.json(
        { error: "This platform account is already connected" },
        { status: 409 }
      );
    }

    // TODO: Validate the access token with the platform's API
    // For now, we'll trust the provided token
    const tokenValidation = await validatePlatformToken(validatedData.platform, validatedData.accessToken);
    
    if (!tokenValidation.valid) {
      return NextResponse.json(
        { error: "Invalid access token", details: tokenValidation.error },
        { status: 400 }
      );
    }

    // Create new platform connection
    const newPlatform = await db.insert(socialPlatforms).values({
      orgId: session.user.orgId,
      platform: validatedData.platform,
      accountName: validatedData.accountName,
      accountId: validatedData.accountId,
      accessToken: validatedData.accessToken, // TODO: Encrypt in production
      refreshToken: validatedData.refreshToken,
      expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined,
      isActive: true,
      metadata: {
        ...validatedData.metadata,
        connectedAt: new Date().toISOString(),
        tokenValidation: tokenValidation.metadata,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Get the created platform
    const createdPlatform = await db
      .select({
        id: socialPlatforms.id,
        platform: socialPlatforms.platform,
        accountName: socialPlatforms.accountName,
        accountId: socialPlatforms.accountId,
        isActive: socialPlatforms.isActive,
        createdAt: socialPlatforms.createdAt,
      })
      .from(socialPlatforms)
      .where(eq(socialPlatforms.id, newPlatform.insertId as number))
      .limit(1);

    return NextResponse.json({
      message: "Platform connected successfully",
      platform: createdPlatform[0],
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error connecting platform:", error);
    return NextResponse.json(
      { error: "Failed to connect platform" },
      { status: 500 }
    );
  }
}

// Helper function to validate platform tokens
async function validatePlatformToken(platform: string, accessToken: string) {
  // TODO: Implement actual platform API validation
  // For development, we'll simulate validation
  
  try {
    switch (platform) {
      case "instagram":
        // TODO: Call Instagram Basic Display API to validate token
        // const response = await fetch(`https://graph.instagram.com/me?access_token=${accessToken}`);
        return {
          valid: true,
          metadata: {
            platform: "instagram",
            validatedAt: new Date().toISOString(),
            simulation: true,
          }
        };
        
      case "facebook":
        // TODO: Call Facebook Graph API to validate token
        // const response = await fetch(`https://graph.facebook.com/me?access_token=${accessToken}`);
        return {
          valid: true,
          metadata: {
            platform: "facebook",
            validatedAt: new Date().toISOString(),
            simulation: true,
          }
        };
        
      case "tiktok":
        // TODO: Call TikTok API to validate token
        return {
          valid: true,
          metadata: {
            platform: "tiktok",
            validatedAt: new Date().toISOString(),
            simulation: true,
          }
        };
        
      case "youtube":
        // TODO: Call YouTube Data API to validate token
        return {
          valid: true,
          metadata: {
            platform: "youtube",
            validatedAt: new Date().toISOString(),
            simulation: true,
          }
        };
        
      default:
        return {
          valid: false,
          error: "Unsupported platform",
        };
    }
  } catch (error) {
    return {
      valid: false,
      error: "Token validation failed",
    };
  }
}