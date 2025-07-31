import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Organization - represents a business/clinic
  orgs: defineTable({
    name: v.string(),
    logo: v.optional(v.string()),
    domain: v.optional(v.string()),
    qrKey: v.optional(v.string()),
    stripe_customer_id: v.optional(v.string()),
    limits: v.object({
      clients: v.number(),
      storage_gb: v.number(),
      messages_per_month: v.number(),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // Users - belong to an org with roles
  users: defineTable({
    orgId: v.id("orgs"),
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("manager"), v.literal("staff")),
    lastLogin: v.optional(v.number()),
    invited_by: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_email", ["email"]),

  // Clients - aesthetic customers
  clients: defineTable({
    orgId: v.id("orgs"),
    // Basic Information
    fullName: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    gender: v.union(v.literal("male"), v.literal("female"), v.literal("other")),
    dateOfBirth: v.optional(v.string()),
    nickName: v.optional(v.string()),

    // Contact Information
    email: v.optional(v.string()),
    phones: v.array(v.string()),
    phone2: v.optional(v.string()),

    // Address Information
    address: v.optional(
      v.object({
        street: v.string(),
        addressLine2: v.optional(v.string()),
        city: v.string(),
        state: v.string(),
        country: v.optional(v.string()),
        zip: v.string(),
      }),
    ),

    // Business Information
    referralSource: v.optional(v.string()),
    membershipType: v.optional(v.string()),
    totalSales: v.optional(v.number()),
    relationship: v.optional(v.string()),

    // Status and Tracking
    clientPortalStatus: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("pending"),
    ),
    visited: v.optional(v.boolean()),
    fired: v.optional(v.boolean()),
    upcomingAppointment: v.optional(v.number()),

    // Additional Fields
    tags: v.array(v.string()),
    profileImageUrl: v.optional(v.string()),
    externalId: v.optional(v.string()), // Original ID from import
    importSource: v.optional(v.string()), // Track where client was imported from

    // Timestamps
    clientCreatedDate: v.optional(v.number()), // Original creation date from import
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_email", ["email"])
    .index("by_phone", ["phones"])
    .index("by_name", ["fullName"]),

  // Appointments - linked to clients
  appointments: defineTable({
    orgId: v.id("orgs"),
    clientId: v.id("clients"),
    dateTime: v.number(),
    type: v.string(),
    provider: v.string(),
    notes: v.optional(v.string()),
    googleEventId: v.optional(v.string()),
    status: v.union(
      v.literal("scheduled"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("no_show"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_client", ["clientId"])
    .index("by_date", ["dateTime"]),

  // Google Calendar Providers - manage calendar connections
  googleCalendarProviders: defineTable({
    orgId: v.id("orgs"),
    name: v.string(),
    email: v.string(),
    color: v.string(),
    isConnected: v.boolean(),
    googleCalendarId: v.optional(v.string()),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    lastSync: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_email", ["email"]),

  // Notes - tagged notes for clients
  notes: defineTable({
    orgId: v.id("orgs"),
    clientId: v.id("clients"),
    authorId: v.id("users"),
    text: v.string(),
    tag: v.string(), // goal, outcome, general, etc.
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_client", ["clientId"])
    .index("by_tag", ["tag"]),

  // Workflows - automation logic
  workflows: defineTable({
    orgId: v.id("orgs"),
    name: v.string(),
    description: v.optional(v.string()),
    trigger: v.union(
      v.literal("new_client"),
      v.literal("appointment_completed"),
      v.literal("appointment_scheduled"),
      v.literal("manual"),
    ),
    conditions: v.array(
      v.object({
        field: v.string(),
        operator: v.union(
          v.literal("equals"),
          v.literal("contains"),
          v.literal("greater_than"),
        ),
        value: v.string(),
      }),
    ),
    actions: v.array(
      v.object({
        type: v.union(
          v.literal("send_sms"),
          v.literal("send_email"),
          v.literal("delay"),
          v.literal("tag"),
          v.literal("conditional"),
        ),
        config: v.any(),
        order: v.number(),
      }),
    ),
    // Visual workflow data for the editor
    blocks: v.optional(
      v.array(
        v.object({
          id: v.string(),
          type: v.string(),
          position: v.object({
            x: v.number(),
            y: v.number(),
          }),
          width: v.number(),
          height: v.number(),
          config: v.any(),
        }),
      ),
    ),
    connections: v.optional(
      v.array(
        v.object({
          id: v.string(),
          from: v.string(),
          to: v.string(),
          fromPort: v.string(),
          toPort: v.string(),
        }),
      ),
    ),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_trigger", ["trigger"]),

  // Message Templates - reusable content
  messageTemplates: defineTable({
    orgId: v.id("orgs"),
    name: v.string(),
    type: v.union(v.literal("sms"), v.literal("email")),
    subject: v.optional(v.string()), // for emails
    content: v.string(),
    mergeTags: v.array(v.string()), // {{first_name}}, {{dob}}, etc.
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_type", ["type"]),

  // Files - images/docs on S3
  files: defineTable({
    orgId: v.id("orgs"),
    clientId: v.id("clients"),
    key: v.string(), // S3 key
    filename: v.string(),
    type: v.string(),
    size: v.number(),
    cropData: v.optional(
      v.object({
        x: v.number(),
        y: v.number(),
        width: v.number(),
        height: v.number(),
      }),
    ),
    tag: v.string(), // before, after, reference, raw
    thumbnailUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_client", ["clientId"])
    .index("by_tag", ["tag"]),

  // Messages - sent messages history
  messages: defineTable({
    orgId: v.id("orgs"),
    clientId: v.optional(v.id("clients")), // Optional for test messages
    type: v.union(v.literal("sms"), v.literal("email")),
    content: v.string(),
    status: v.union(
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("failed"),
      v.literal("pending"),
    ),
    externalId: v.optional(v.string()), // AWS SNS/SES message ID
    scheduledFor: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_client", ["clientId"])
    .index("by_status", ["status"]),

  // Workflow Executions - track workflow runs
  workflowExecutions: defineTable({
    orgId: v.id("orgs"),
    workflowId: v.id("workflows"),
    clientId: v.id("clients"),
    status: v.union(
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled"),
    ),
    actionsCompleted: v.array(v.number()),
    error: v.optional(v.string()),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_org", ["orgId"])
    .index("by_workflow", ["workflowId"])
    .index("by_client", ["clientId"]),

  // Social Media Platforms - connected social accounts
  socialPlatforms: defineTable({
    orgId: v.id("orgs"),
    platform: v.union(
      v.literal("instagram"),
      v.literal("facebook"),
      v.literal("twitter"),
      v.literal("tiktok"),
    ),
    accountName: v.string(),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    isConnected: v.boolean(),
    lastSync: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_platform", ["platform"]),

  // Social Media Posts - published content
  socialPosts: defineTable({
    orgId: v.id("orgs"),
    platformId: v.id("socialPlatforms"),
    content: v.string(),
    mediaUrls: v.array(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("published"),
      v.literal("failed"),
    ),
    scheduledFor: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
    externalPostId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_platform", ["platformId"])
    .index("by_status", ["status"]),

  // Social Media Analytics - engagement metrics
  socialAnalytics: defineTable({
    orgId: v.id("orgs"),
    postId: v.id("socialPosts"),
    platform: v.union(
      v.literal("instagram"),
      v.literal("facebook"),
      v.literal("twitter"),
      v.literal("tiktok"),
    ),
    likes: v.number(),
    comments: v.number(),
    shares: v.number(),
    views: v.number(),
    date: v.number(),
    createdAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_post", ["postId"])
    .index("by_platform", ["platform"]),

  // Notifications - in-app notifications
  notifications: defineTable({
    orgId: v.id("orgs"),
    userId: v.optional(v.id("users")),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("info"),
      v.literal("success"),
      v.literal("warning"),
      v.literal("error"),
      v.literal("appointment"),
      v.literal("workflow"),
      v.literal("client"),
      v.literal("message"),
    ),
    read: v.boolean(),
    actionUrl: v.optional(v.string()),
    actionText: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_user", ["userId"])
    .index("by_read", ["read"])
    .index("by_created", ["createdAt"]),

  // Bulk Messages - track bulk messaging campaigns
  bulkMessages: defineTable({
    orgId: v.id("orgs"),
    name: v.string(),
    type: v.union(v.literal("email"), v.literal("sms")),
    templateId: v.optional(v.id("messageTemplates")),
    subject: v.optional(v.string()),
    content: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("sending"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    scheduledFor: v.optional(v.number()),
    totalRecipients: v.number(),
    sentCount: v.number(),
    failedCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_status", ["status"]),

  // Message Recipients - track individual message delivery
  messageRecipients: defineTable({
    orgId: v.id("orgs"),
    bulkMessageId: v.id("bulkMessages"),
    clientId: v.id("clients"),
    type: v.union(v.literal("email"), v.literal("sms")),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("failed"),
    ),
    externalId: v.optional(v.string()), // AWS SNS/SES message ID
    errorMessage: v.optional(v.string()),
    sentAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_bulk_message", ["bulkMessageId"])
    .index("by_client", ["clientId"])
    .index("by_status", ["status"]),

  // AWS Configuration - store AWS credentials and settings
  awsConfig: defineTable({
    orgId: v.id("orgs"),
    region: v.string(),
    sesAccessKey: v.optional(v.string()),
    sesSecretKey: v.optional(v.string()),
    snsAccessKey: v.optional(v.string()),
    snsSecretKey: v.optional(v.string()),
    fromEmail: v.optional(v.string()),
    fromPhone: v.optional(v.string()),
    isConfigured: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_org", ["orgId"]),
});
