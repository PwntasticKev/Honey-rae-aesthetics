import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

// Get bulk import job by job ID
export const getBulkImportJob = internalQuery({
  args: { jobId: v.string() },
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("bulkImportJobs")
      .withIndex("by_job_id", (q) => q.eq("jobId", args.jobId))
      .first();

    return job;
  },
});

// Update bulk import progress
export const updateBulkImportProgress = internalMutation({
  args: {
    jobId: v.string(),
    processedRows: v.number(),
    successfulRows: v.number(),
    failedRows: v.number(),
    errors: v.array(
      v.object({
        row: v.number(),
        column: v.optional(v.string()),
        error: v.string(),
      }),
    ),
    createdPostIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("bulkImportJobs")
      .withIndex("by_job_id", (q) => q.eq("jobId", args.jobId))
      .first();

    if (job) {
      await ctx.db.patch(job._id, {
        processedRows: args.processedRows,
        successfulRows: args.successfulRows,
        failedRows: args.failedRows,
        errors: args.errors,
        createdPostIds: args.createdPostIds.map((id) => id as any), // Type assertion for ID array
      });
    }
  },
});

// Complete bulk import job
export const completeBulkImportJob = internalMutation({
  args: {
    jobId: v.string(),
    processedRows: v.number(),
    successfulRows: v.number(),
    failedRows: v.number(),
    errors: v.array(
      v.object({
        row: v.number(),
        column: v.optional(v.string()),
        error: v.string(),
      }),
    ),
    createdPostIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("bulkImportJobs")
      .withIndex("by_job_id", (q) => q.eq("jobId", args.jobId))
      .first();

    if (job) {
      await ctx.db.patch(job._id, {
        processedRows: args.processedRows,
        successfulRows: args.successfulRows,
        failedRows: args.failedRows,
        errors: args.errors,
        createdPostIds: args.createdPostIds.map((id) => id as any),
        status:
          args.failedRows > 0 && args.successfulRows === 0
            ? "failed"
            : "completed",
        completedAt: Date.now(),
      });
    }
  },
});
