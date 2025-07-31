import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new bulk message campaign
export const create = mutation({
  args: {
    orgId: v.id("orgs"),
    name: v.string(),
    type: v.union(v.literal("email"), v.literal("sms")),
    templateId: v.optional(v.id("messageTemplates")),
    subject: v.optional(v.string()),
    content: v.string(),
    scheduledFor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const bulkMessageId = await ctx.db.insert("bulkMessages", {
      ...args,
      status: "draft",
      totalRecipients: 0,
      sentCount: 0,
      failedCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    return bulkMessageId;
  },
});

// Get all bulk messages for an org
export const getByOrg = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bulkMessages")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .order("desc")
      .collect();
  },
});

// Get a specific bulk message
export const get = query({
  args: { id: v.id("bulkMessages") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Update bulk message status
export const updateStatus = mutation({
  args: {
    id: v.id("bulkMessages"),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("sending"),
      v.literal("completed"),
      v.literal("failed"),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

// Send bulk message to selected clients
export const sendBulkMessage = mutation({
  args: {
    bulkMessageId: v.id("bulkMessages"),
    clientIds: v.array(v.id("clients")),
  },
  handler: async (ctx, args) => {
    const bulkMessage = await ctx.db.get(args.bulkMessageId);
    if (!bulkMessage) {
      throw new Error("Bulk message not found");
    }

    // Update bulk message status to sending
    await ctx.db.patch(args.bulkMessageId, {
      status: "sending",
      totalRecipients: args.clientIds.length,
      updatedAt: Date.now(),
    });

    // Create recipient records for each client
    const recipientIds = [];
    for (const clientId of args.clientIds) {
      const recipientId = await ctx.db.insert("messageRecipients", {
        orgId: bulkMessage.orgId,
        bulkMessageId: args.bulkMessageId,
        clientId,
        type: bulkMessage.type,
        status: "pending",
        createdAt: Date.now(),
      });
      recipientIds.push(recipientId);
    }

    return {
      bulkMessageId: args.bulkMessageId,
      recipientIds,
      totalRecipients: args.clientIds.length,
    };
  },
});

// Get message recipients for a bulk message
export const getRecipients = query({
  args: { bulkMessageId: v.id("bulkMessages") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messageRecipients")
      .withIndex("by_bulk_message", (q) =>
        q.eq("bulkMessageId", args.bulkMessageId),
      )
      .collect();
  },
});

// Update recipient status
export const updateRecipientStatus = mutation({
  args: {
    recipientId: v.id("messageRecipients"),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("failed"),
    ),
    externalId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const update: any = {
      status: args.status,
    };

    if (args.status === "sent") {
      update.sentAt = Date.now();
    } else if (args.status === "delivered") {
      update.deliveredAt = Date.now();
    }

    if (args.externalId) {
      update.externalId = args.externalId;
    }

    if (args.errorMessage) {
      update.errorMessage = args.errorMessage;
    }

    await ctx.db.patch(args.recipientId, update);

    // Update bulk message counts
    const recipient = await ctx.db.get(args.recipientId);
    if (recipient) {
      const bulkMessage = await ctx.db.get(recipient.bulkMessageId);
      if (bulkMessage) {
        const newCounts = {
          sentCount: bulkMessage.sentCount,
          failedCount: bulkMessage.failedCount,
        };

        if (args.status === "sent" || args.status === "delivered") {
          newCounts.sentCount += 1;
        } else if (args.status === "failed") {
          newCounts.failedCount += 1;
        }

        await ctx.db.patch(recipient.bulkMessageId, {
          ...newCounts,
          status:
            newCounts.sentCount + newCounts.failedCount >=
            bulkMessage.totalRecipients
              ? "completed"
              : "sending",
          updatedAt: Date.now(),
        });
      }
    }
  },
});
