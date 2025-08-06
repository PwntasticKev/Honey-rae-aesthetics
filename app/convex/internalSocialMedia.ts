import { v } from "convex/values";
import {
  internalQuery,
  internalMutation,
  internalAction,
} from "./_generated/server";

export const createPost = internalMutation({
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

// Internal function to get post for publishing
export const getPostForPublishing = internalQuery({
  args: { postId: v.id("socialPosts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.postId);
  },
});

// Internal function to update post status
export const updatePostStatus = internalMutation({
  args: {
    postId: v.id("socialPosts"),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("publishing"),
      v.literal("published"),
      v.literal("failed"),
      v.literal("cancelled"),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.postId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

// Internal function to update publishing results
export const updatePublishingResults = internalMutation({
  args: {
    postId: v.id("socialPosts"),
    results: v.array(
      v.object({
        platform: v.string(),
        status: v.union(v.literal("success"), v.literal("failed")),
        externalPostId: v.optional(v.string()),
        error: v.optional(v.string()),
        publishedAt: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.postId, {
      publishingResults: args.results,
      updatedAt: Date.now(),
    });
  },
});

// Internal function to publish to a specific platform
export const publishToPlatform = internalAction({
  args: {
    postId: v.id("socialPosts"),
    platform: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    platform: string;
    status: "success" | "failed";
    externalPostId?: string;
    publishedAt?: number;
    error?: string;
  }> => {
    // This would integrate with actual platform APIs
    // For now, simulate the publishing process

    // Mock delay to simulate API call
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 2000),
    );

    // Simulate success/failure (90% success rate)
    const success = Math.random() > 0.1;

    if (success) {
      return {
        platform: args.platform,
        status: "success" as const,
        externalPostId: `${args.platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        publishedAt: Date.now(),
      };
    } else {
      // To match the return type, we throw an error that will be caught in the calling action
      throw new Error(
        `Failed to publish to ${args.platform}: API rate limit exceeded`,
      );
    }
  },
});
