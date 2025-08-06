import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { internal } from "./_generated/api";

// Create a bulk import job
export const createBulkImportJob = mutation({
  args: {
    orgId: v.id("orgs"),
    userId: v.id("users"),
    fileName: v.string(),
    totalRows: v.number(),
  },
  handler: async (ctx, args) => {
    const jobId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const importJobId = await ctx.db.insert("bulkImportJobs", {
      orgId: args.orgId,
      userId: args.userId,
      jobId,
      fileName: args.fileName,
      totalRows: args.totalRows,
      processedRows: 0,
      successfulRows: 0,
      failedRows: 0,
      status: "processing",
      errors: [],
      createdPostIds: [],
      createdAt: Date.now(),
    });

    return { importJobId, jobId };
  },
});

// Process CSV data for bulk import
export const processBulkImport = action({
  args: {
    orgId: v.id("orgs"),
    userId: v.id("users"),
    jobId: v.string(),
    csvData: v.array(
      v.object({
        title: v.string(),
        content: v.string(),
        hashtags: v.optional(v.string()), // Comma-separated hashtags
        platforms: v.string(), // Comma-separated platforms
        scheduledDate: v.optional(v.string()), // ISO date string
        scheduledTime: v.optional(v.string()), // Time string like "14:30"
        timezone: v.optional(v.string()),
        mediaUrl: v.optional(v.string()),
        mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const job = await ctx.runQuery(
      internal.internalBulkImport.getBulkImportJob,
      {
        jobId: args.jobId,
      },
    );

    if (!job) {
      throw new Error("Import job not found");
    }

    const errors: Array<{ row: number; column?: string; error: string }> = [];
    const createdPostIds: string[] = [];
    let processedRows = 0;
    let successfulRows = 0;

    for (let i = 0; i < args.csvData.length; i++) {
      const row = args.csvData[i];
      processedRows++;

      try {
        // Validate required fields
        if (!row.title?.trim()) {
          throw new Error("Title is required");
        }
        if (!row.content?.trim()) {
          throw new Error("Content is required");
        }
        if (!row.platforms?.trim()) {
          throw new Error("At least one platform is required");
        }

        // Parse hashtags
        const hashtags = row.hashtags
          ? row.hashtags
              .split(",")
              .map((tag) => tag.trim())
              .filter((tag) => tag.length > 0)
          : [];

        // Parse platforms
        const platforms = row.platforms
          .split(",")
          .map((platform) => platform.trim().toLowerCase())
          .filter((platform) =>
            [
              "instagram",
              "facebook",
              "youtube",
              "google_business",
              "tiktok",
              "linkedin",
              "apple_business",
            ].includes(platform),
          );

        if (platforms.length === 0) {
          throw new Error("No valid platforms specified");
        }

        // Parse scheduled time
        let scheduledFor: number | undefined;
        if (row.scheduledDate) {
          const date = new Date(row.scheduledDate);
          if (isNaN(date.getTime())) {
            throw new Error("Invalid date format");
          }

          if (row.scheduledTime) {
            const [hours, minutes] = row.scheduledTime.split(":").map(Number);
            if (
              isNaN(hours) ||
              isNaN(minutes) ||
              hours < 0 ||
              hours > 23 ||
              minutes < 0 ||
              minutes > 59
            ) {
              throw new Error("Invalid time format (use HH:MM)");
            }
            date.setHours(hours, minutes, 0, 0);
          }

          scheduledFor = date.getTime();
        }

        // Prepare media files
        const mediaFiles = [];
        if (row.mediaUrl) {
          const mediaType = row.mediaType || "image";
          mediaFiles.push({
            url: row.mediaUrl,
            type: mediaType,
            fileName: `imported_media_${i + 1}.${mediaType === "video" ? "mp4" : "jpg"}`,
            fileSize: 0, // Unknown for imported files
            mimeType: mediaType === "video" ? "video/mp4" : "image/jpeg",
          });
        }

        // Create the post
        const postId = await ctx.runMutation(
          internal.internalSocialMedia.createPost,
          {
            orgId: args.orgId,
            userId: args.userId,
            title: row.title.trim(),
            content: row.content.trim(),
            hashtags,
            targetPlatforms: platforms,
            mediaFiles,
            scheduledFor,
            timezone: row.timezone || "America/Denver",
            bulkImportId: args.jobId,
          },
        );

        createdPostIds.push(postId);
        successfulRows++;

        // Update progress every 10 rows
        if (processedRows % 10 === 0 || processedRows === args.csvData.length) {
          await ctx.runMutation(
            internal.internalBulkImport.updateBulkImportProgress,
            {
              jobId: args.jobId,
              processedRows,
              successfulRows,
              failedRows: processedRows - successfulRows,
              errors,
              createdPostIds,
            },
          );
        }
      } catch (error) {
        errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Mark job as completed
    await ctx.runMutation(internal.internalBulkImport.completeBulkImportJob, {
      jobId: args.jobId,
      processedRows,
      successfulRows,
      failedRows: processedRows - successfulRows,
      errors,
      createdPostIds,
    });

    return {
      success: true,
      processedRows,
      successfulRows,
      failedRows: processedRows - successfulRows,
      errors: errors.slice(0, 50), // Limit errors returned
    };
  },
});

// Get import jobs for organization
export const getImportJobs = query({
  args: {
    orgId: v.id("orgs"),
    status: v.optional(
      v.union(
        v.literal("processing"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("cancelled"),
      ),
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("bulkImportJobs")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const jobs = await query.order("desc").take(args.limit || 10);

    // Get user information for each job
    const jobsWithUsers = await Promise.all(
      jobs.map(async (job) => {
        const user = await ctx.db.get(job.userId);
        return {
          ...job,
          user: user ? { name: user.name, email: user.email } : null,
        };
      }),
    );

    return jobsWithUsers;
  },
});

// Cancel a bulk import job
export const cancelBulkImportJob = mutation({
  args: { jobId: v.string() },
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("bulkImportJobs")
      .withIndex("by_job_id", (q) => q.eq("jobId", args.jobId))
      .first();

    if (job && job.status === "processing") {
      await ctx.db.patch(job._id, {
        status: "cancelled",
        completedAt: Date.now(),
      });
    }
  },
});

// Get sample CSV template
export const getSampleCSVTemplate = query({
  args: {},
  handler: async (ctx, args) => {
    return {
      headers: [
        "title",
        "content",
        "hashtags",
        "platforms",
        "scheduledDate",
        "scheduledTime",
        "timezone",
        "mediaUrl",
        "mediaType",
      ],
      sampleRows: [
        {
          title: "Summer Skincare Tips",
          content:
            "Protect your skin this summer with our expert tips! ☀️ Book your consultation today.",
          hashtags: "#skincare,#summer,#protection,#consultation",
          platforms: "instagram,facebook",
          scheduledDate: "2024-07-15",
          scheduledTime: "10:00",
          timezone: "America/Denver",
          mediaUrl: "https://example.com/summer-skincare.jpg",
          mediaType: "image",
        },
        {
          title: "Before & After Transformation",
          content:
            "Amazing results from our Botox treatment! See the difference in just 2 weeks.",
          hashtags: "#botox,#transformation,#beforeafter,#results",
          platforms: "instagram,tiktok,facebook",
          scheduledDate: "2024-07-16",
          scheduledTime: "14:30",
          timezone: "America/Denver",
          mediaUrl: "https://example.com/before-after.jpg",
          mediaType: "image",
        },
      ],
      instructions: {
        title: "Required. The post title/headline (max 100 characters)",
        content: "Required. The main post content/caption",
        hashtags: "Optional. Comma-separated hashtags (without #)",
        platforms:
          "Required. Comma-separated platforms: instagram,facebook,youtube,google_business,tiktok,linkedin,apple_business",
        scheduledDate: "Optional. Date in YYYY-MM-DD format",
        scheduledTime: "Optional. Time in HH:MM format (24-hour)",
        timezone: "Optional. Timezone (defaults to America/Denver)",
        mediaUrl: "Optional. Direct URL to image or video file",
        mediaType: "Optional. Either 'image' or 'video' (defaults to 'image')",
      },
    };
  },
});

// Validate CSV data before import
export const validateCSVData = action({
  args: {
    csvData: v.array(
      v.object({
        title: v.optional(v.string()),
        content: v.optional(v.string()),
        hashtags: v.optional(v.string()),
        platforms: v.optional(v.string()),
        scheduledDate: v.optional(v.string()),
        scheduledTime: v.optional(v.string()),
        timezone: v.optional(v.string()),
        mediaUrl: v.optional(v.string()),
        mediaType: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const errors: Array<{ row: number; column: string; error: string }> = [];
    const validRows: number[] = [];

    for (let i = 0; i < args.csvData.length; i++) {
      const row = args.csvData[i];
      const rowNum = i + 1;
      let hasErrors = false;

      // Check required fields
      if (!row.title?.trim()) {
        errors.push({
          row: rowNum,
          column: "title",
          error: "Title is required",
        });
        hasErrors = true;
      } else if (row.title.length > 100) {
        errors.push({
          row: rowNum,
          column: "title",
          error: "Title must be 100 characters or less",
        });
        hasErrors = true;
      }

      if (!row.content?.trim()) {
        errors.push({
          row: rowNum,
          column: "content",
          error: "Content is required",
        });
        hasErrors = true;
      }

      if (!row.platforms?.trim()) {
        errors.push({
          row: rowNum,
          column: "platforms",
          error: "At least one platform is required",
        });
        hasErrors = true;
      } else {
        const platforms = row.platforms
          .split(",")
          .map((p) => p.trim().toLowerCase());
        const validPlatforms = [
          "instagram",
          "facebook",
          "youtube",
          "google_business",
          "tiktok",
          "linkedin",
          "apple_business",
        ];
        const invalidPlatforms = platforms.filter(
          (p) => !validPlatforms.includes(p),
        );
        if (invalidPlatforms.length > 0) {
          errors.push({
            row: rowNum,
            column: "platforms",
            error: `Invalid platforms: ${invalidPlatforms.join(", ")}. Valid options: ${validPlatforms.join(", ")}`,
          });
          hasErrors = true;
        }
      }

      // Validate date format
      if (row.scheduledDate) {
        const date = new Date(row.scheduledDate);
        if (isNaN(date.getTime())) {
          errors.push({
            row: rowNum,
            column: "scheduledDate",
            error: "Invalid date format. Use YYYY-MM-DD",
          });
          hasErrors = true;
        }
      }

      // Validate time format
      if (row.scheduledTime) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(row.scheduledTime)) {
          errors.push({
            row: rowNum,
            column: "scheduledTime",
            error: "Invalid time format. Use HH:MM (24-hour)",
          });
          hasErrors = true;
        }
      }

      // Validate media type
      if (
        row.mediaType &&
        !["image", "video"].includes(row.mediaType.toLowerCase())
      ) {
        errors.push({
          row: rowNum,
          column: "mediaType",
          error: 'Media type must be either "image" or "video"',
        });
        hasErrors = true;
      }

      if (!hasErrors) {
        validRows.push(rowNum);
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors.slice(0, 100), // Limit errors returned
      validRows,
      totalRows: args.csvData.length,
      validRowCount: validRows.length,
      errorRowCount: args.csvData.length - validRows.length,
    };
  },
});
