import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

// Platform configurations with optimal aspect ratios
const PLATFORM_CONFIGS = {
  instagram: {
    name: "Instagram",
    aspectRatios: ["1:1", "4:5", "16:9"],
    optimalRatio: "1:1",
    maxCharacters: 2200,
    supportedMedia: ["image", "video"],
    color: "#E4405F",
  },
  facebook: {
    name: "Facebook",
    aspectRatios: ["16:9", "1:1", "4:5"],
    optimalRatio: "16:9",
    maxCharacters: 2000,
    supportedMedia: ["image", "video"],
    color: "#1877F2",
  },
  youtube: {
    name: "YouTube",
    aspectRatios: ["16:9", "9:16"],
    optimalRatio: "16:9",
    maxCharacters: 5000,
    supportedMedia: ["video"],
    color: "#FF0000",
  },
  google_business: {
    name: "Google Business Profile",
    aspectRatios: ["1:1", "4:3", "16:9"],
    optimalRatio: "1:1",
    maxCharacters: 1500,
    supportedMedia: ["image", "video"],
    color: "#4285F4",
  },
  tiktok: {
    name: "TikTok",
    aspectRatios: ["9:16", "1:1"],
    optimalRatio: "9:16",
    maxCharacters: 150,
    supportedMedia: ["video"],
    color: "#000000",
  },
  linkedin: {
    name: "LinkedIn",
    aspectRatios: ["1.91:1", "1:1", "4:5"],
    optimalRatio: "1.91:1",
    maxCharacters: 3000,
    supportedMedia: ["image", "video"],
    color: "#0A66C2",
  },
  apple_business: {
    name: "Apple Business Connect",
    aspectRatios: ["1:1", "4:3"],
    optimalRatio: "1:1",
    maxCharacters: 500,
    supportedMedia: ["image"],
    color: "#000000",
  },
};

// Get connected social platforms for an organization
export const getConnectedPlatforms = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    const platforms = await ctx.db
      .query("socialPlatforms")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    return platforms.map((platform) => ({
      ...platform,
      config:
        PLATFORM_CONFIGS[platform.platform as keyof typeof PLATFORM_CONFIGS],
    }));
  },
});

// Connect a new social media platform
export const connectPlatform = mutation({
  args: {
    orgId: v.id("orgs"),
    platform: v.union(
      v.literal("instagram"),
      v.literal("facebook"),
      v.literal("youtube"),
      v.literal("google_business"),
      v.literal("tiktok"),
      v.literal("linkedin"),
      v.literal("apple_business"),
    ),
    accountName: v.string(),
    accountId: v.optional(v.string()),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
    profileImageUrl: v.optional(v.string()),
    followerCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if platform already connected
    const existing = await ctx.db
      .query("socialPlatforms")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("platform"), args.platform))
      .first();

    if (existing) {
      // Update existing connection
      await ctx.db.patch(existing._id, {
        accountName: args.accountName,
        accountId: args.accountId,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        tokenExpiresAt: args.tokenExpiresAt,
        isConnected: true,
        profileImageUrl: args.profileImageUrl,
        followerCount: args.followerCount,
        connectionError: undefined,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      // Create new connection
      const platformId = await ctx.db.insert("socialPlatforms", {
        orgId: args.orgId,
        platform: args.platform,
        accountName: args.accountName,
        accountId: args.accountId,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        tokenExpiresAt: args.tokenExpiresAt,
        isConnected: true,
        profileImageUrl: args.profileImageUrl,
        followerCount: args.followerCount,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return platformId;
    }
  },
});

// Disconnect a social media platform
export const disconnectPlatform = mutation({
  args: { platformId: v.id("socialPlatforms") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.platformId, {
      isConnected: false,
      accessToken: undefined,
      refreshToken: undefined,
      connectionError: undefined,
      updatedAt: Date.now(),
    });
  },
});

// Create a new social media post
export const createPost = mutation({
  args: {
    orgId: v.id("orgs"),
    userId: v.id("users"),
    title: v.string(),
    content: v.string(),
    hashtags: v.array(v.string()),
    targetPlatforms: v.array(v.string()),
    mediaFiles: v.array(
      v.object({
        url: v.string(),
        type: v.union(v.literal("image"), v.literal("video")),
        fileName: v.string(),
        fileSize: v.number(),
        mimeType: v.string(),
      }),
    ),
    scheduledFor: v.optional(v.number()),
    timezone: v.optional(v.string()),
    bulkImportId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const status =
      args.scheduledFor && args.scheduledFor > now ? "scheduled" : "draft";

    const postId = await ctx.db.insert("socialPosts", {
      orgId: args.orgId,
      title: args.title,
      content: args.content,
      hashtags: args.hashtags,
      mediaFiles: args.mediaFiles,
      targetPlatforms: args.targetPlatforms,
      status,
      scheduledFor: args.scheduledFor,
      timezone: args.timezone || "America/Denver", // Default to Mountain Time
      bulkImportId: args.bulkImportId,
      createdBy: args.userId,
      createdAt: now,
      updatedAt: now,
    });

    // Schedule publishing if scheduled
    if (args.scheduledFor && args.scheduledFor > now) {
      await ctx.db.insert("scheduledActions", {
        orgId: args.orgId,
        action: "publishSocialPost",
        args: { postId },
        scheduledFor: args.scheduledFor,
        status: "pending",
        attempts: 0,
        maxAttempts: 3,
        createdAt: now,
        updatedAt: now,
      });
    }

    return postId;
  },
});

// Get posts with filtering and pagination
export const getPosts = query({
  args: {
    orgId: v.id("orgs"),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("scheduled"),
        v.literal("publishing"),
        v.literal("published"),
        v.literal("failed"),
        v.literal("cancelled"),
      ),
    ),
    platform: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("socialPosts")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    if (args.platform) {
      query = query.filter((q) =>
        q.eq(q.field("targetPlatforms"), [args.platform!]),
      );
    }

    const posts = await query.order("desc").take(args.limit || 20);

    // Get user information for each post
    const postsWithUsers = await Promise.all(
      posts.map(async (post) => {
        const creator = await ctx.db.get(post.createdBy);
        const lastEditor = post.lastEditedBy
          ? await ctx.db.get(post.lastEditedBy)
          : null;

        return {
          ...post,
          creator: creator
            ? { name: creator.name, email: creator.email }
            : null,
          lastEditor: lastEditor
            ? { name: lastEditor.name, email: lastEditor.email }
            : null,
        };
      }),
    );

    return postsWithUsers;
  },
});

// Update a post
export const updatePost = mutation({
  args: {
    postId: v.id("socialPosts"),
    userId: v.id("users"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    hashtags: v.optional(v.array(v.string())),
    targetPlatforms: v.optional(v.array(v.string())),
    mediaFiles: v.optional(
      v.array(
        v.object({
          url: v.string(),
          type: v.union(v.literal("image"), v.literal("video")),
          fileName: v.string(),
          fileSize: v.number(),
          mimeType: v.string(),
        }),
      ),
    ),
    scheduledFor: v.optional(v.number()),
    timezone: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("scheduled"),
        v.literal("cancelled"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    const updates: any = {
      lastEditedBy: args.userId,
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) updates.content = args.content;
    if (args.hashtags !== undefined) updates.hashtags = args.hashtags;
    if (args.targetPlatforms !== undefined)
      updates.targetPlatforms = args.targetPlatforms;
    if (args.mediaFiles !== undefined) updates.mediaFiles = args.mediaFiles;
    if (args.scheduledFor !== undefined) {
      updates.scheduledFor = args.scheduledFor;
      // Update status based on schedule
      if (args.scheduledFor > Date.now()) {
        updates.status = "scheduled";
      }
    }
    if (args.timezone !== undefined) updates.timezone = args.timezone;
    if (args.status !== undefined) updates.status = args.status;

    await ctx.db.patch(args.postId, updates);
  },
});

// Delete a post
export const deletePost = mutation({
  args: { postId: v.id("socialPosts") },
  handler: async (ctx, args) => {
    // Cancel scheduled publishing if exists
    const scheduledAction = await ctx.db
      .query("scheduledActions")
      .filter((q) =>
        q.and(
          q.eq(q.field("action"), "publishSocialPost"),
          q.eq(q.field("args"), { postId: args.postId } as any),
          q.eq(q.field("status"), "pending"),
        ),
      )
      .first();

    if (scheduledAction) {
      await ctx.db.patch(scheduledAction._id, { status: "cancelled" as any });
    }

    await ctx.db.delete(args.postId);
  },
});

// Publish post immediately
export const publishPostNow = action({
  args: { postId: v.id("socialPosts") },
  handler: async (ctx, args): Promise<{ success: boolean; results: any[] }> => {
    const post = await ctx.runQuery(
      internal.internalSocialMedia.getPostForPublishing,
      {
        postId: args.postId,
      },
    );

    if (!post) {
      throw new Error("Post not found");
    }

    // Update status to publishing
    await ctx.runMutation(internal.internalSocialMedia.updatePostStatus, {
      postId: args.postId,
      status: "publishing",
    });

    try {
      // Publish to each platform
      const results: any[] = [];
      for (const platformName of post.targetPlatforms) {
        try {
          const result = await ctx.runAction(
            internal.internalSocialMedia.publishToPlatform,
            {
              postId: args.postId,
              platform: platformName,
            },
          );
          results.push(result);
        } catch (error) {
          results.push({
            platform: platformName,
            status: "failed" as const,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Update post with publishing results
      await ctx.runMutation(
        internal.internalSocialMedia.updatePublishingResults,
        {
          postId: args.postId,
          results,
        },
      );

      const allSuccess = results.every((r) => r.status === "success");
      await ctx.runMutation(internal.internalSocialMedia.updatePostStatus, {
        postId: args.postId,
        status: allSuccess ? "published" : "failed",
      });

      return { success: allSuccess, results };
    } catch (error) {
      await ctx.runMutation(internal.internalSocialMedia.updatePostStatus, {
        postId: args.postId,
        status: "failed",
      });
      throw error;
    }
  },
});

// Get calendar view of posts
export const getCalendarPosts = query({
  args: {
    orgId: v.id("orgs"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("socialPosts")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) =>
        q.and(
          q.gte(q.field("scheduledFor"), args.startDate),
          q.lte(q.field("scheduledFor"), args.endDate),
          q.neq(q.field("status"), "cancelled"),
        ),
      )
      .collect();

    return posts.map((post) => ({
      id: post._id,
      title: post.title,
      content:
        post.content.substring(0, 100) +
        (post.content.length > 100 ? "..." : ""),
      scheduledFor: post.scheduledFor,
      status: post.status,
      platforms: post.targetPlatforms,
      mediaCount: post.mediaFiles.length,
      timezone: post.timezone,
    }));
  },
});

// Reschedule a post (for drag-drop calendar)
export const reschedulePost = mutation({
  args: {
    postId: v.id("socialPosts"),
    newScheduledTime: v.number(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    // Update the post schedule
    await ctx.db.patch(args.postId, {
      scheduledFor: args.newScheduledTime,
      status: args.newScheduledTime > Date.now() ? "scheduled" : "draft",
      lastEditedBy: args.userId,
      updatedAt: Date.now(),
    });

    // Update or create scheduled action
    const existingAction = await ctx.db
      .query("scheduledActions")
      .filter((q) =>
        q.and(
          q.eq(q.field("action"), "publishSocialPost"),
          q.eq(q.field("args"), { postId: args.postId } as any),
          q.eq(q.field("status"), "pending"),
        ),
      )
      .first();

    if (existingAction) {
      await ctx.db.patch(existingAction._id, {
        scheduledFor: args.newScheduledTime,
        updatedAt: Date.now(),
      });
    } else if (args.newScheduledTime > Date.now()) {
      await ctx.db.insert("scheduledActions", {
        orgId: post.orgId,
        action: "publishSocialPost",
        args: { postId: args.postId },
        scheduledFor: args.newScheduledTime,
        status: "pending",
        attempts: 0,
        maxAttempts: 3,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

// Get platform analytics
export const getAnalytics = query({
  args: {
    orgId: v.id("orgs"),
    platform: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("socialAnalytics")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId));

    if (args.platform) {
      query = query.filter((q) => q.eq(q.field("platform"), args.platform));
    }

    const analytics = await query.collect();

    // Aggregate metrics
    const totals = analytics.reduce(
      (acc, item) => ({
        likes: acc.likes + item.likes,
        comments: acc.comments + item.comments,
        shares: acc.shares + item.shares,
        views: acc.views + item.views,
        impressions: acc.impressions + (item.impressions || 0),
        reach: acc.reach + (item.reach || 0),
      }),
      {
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0,
        impressions: 0,
        reach: 0,
      },
    );

    // Platform breakdown
    const byPlatform = analytics.reduce(
      (acc, item) => {
        if (!acc[item.platform]) {
          acc[item.platform] = { likes: 0, comments: 0, shares: 0, views: 0 };
        }
        acc[item.platform].likes += item.likes;
        acc[item.platform].comments += item.comments;
        acc[item.platform].shares += item.shares;
        acc[item.platform].views += item.views;
        return acc;
      },
      {} as Record<string, any>,
    );

    return {
      totals,
      byPlatform,
      postCount: analytics.length,
      lastUpdated: Math.max(...analytics.map((a) => a.lastUpdated), 0),
    };
  },
});
