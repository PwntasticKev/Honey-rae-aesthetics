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
    theme: v.optional(
      v.union(
        v.object({
          themeId: v.string(),
          appliedAt: v.number(),
          fontFamily: v.optional(v.string()),
        }),
        v.object({
          primaryColor: v.string(),
          secondaryColor: v.string(),
          accentColor: v.string(),
          backgroundColor: v.string(),
          textColor: v.string(),
          borderRadius: v.string(),
          fontFamily: v.string(),
        }),
      ),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // Users - belong to an org with roles
  users: defineTable({
    orgId: v.id("orgs"),
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("manager"), v.literal("staff")),
    // Authentication fields
    passwordHash: v.optional(v.string()), // For email/password login
    googleId: v.optional(v.string()), // For Google OAuth
    profileImageUrl: v.optional(v.string()),
    // Phone and preferences
    phone: v.optional(v.string()),
    twoFactorEnabled: v.optional(v.boolean()), // Optional for backward compatibility
    preferredOtpMethod: v.optional(
      v.union(v.literal("sms"), v.literal("email")),
    ), // Optional for backward compatibility
    // Session management
    lastLogin: v.optional(v.number()),
    isActive: v.optional(v.boolean()), // Optional for backward compatibility
    emailVerified: v.optional(v.boolean()), // Optional for backward compatibility
    phoneVerified: v.optional(v.boolean()), // Optional for backward compatibility
    // Audit fields
    invited_by: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_email", ["email"])
    .index("by_google_id", ["googleId"])
    .index("by_phone", ["phone"]),

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

  // Workflow Directories - organize workflows in folders
  workflowDirectories: defineTable({
    orgId: v.id("orgs"),
    name: v.string(),
    parentId: v.optional(v.id("workflowDirectories")), // For nested directories
    description: v.optional(v.string()),
    color: v.optional(v.string()), // Visual organization
    isArchived: v.optional(v.boolean()), // Archive instead of delete
    archivedAt: v.optional(v.number()), // When archived
    archivedBy: v.optional(v.id("users")), // Who archived it
    originalParentId: v.optional(v.id("workflowDirectories")), // Parent before archiving
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_parent", ["parentId"])
    .index("by_archived", ["orgId", "isArchived"]),

  // Workflows - automation logic
  workflows: defineTable({
    orgId: v.id("orgs"),
    directoryId: v.optional(v.id("workflowDirectories")), // Directory organization
    name: v.string(),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("inactive"),
        v.literal("draft"),
        v.literal("archived"),
      ),
    ),
    trigger: v.union(
      v.literal("new_client"),
      v.literal("appointment_completed"),
      v.literal("appointment_scheduled"),
      v.literal("manual"),
      v.literal("morpheus8"), // Appointment-based triggers
      v.literal("toxins"),
      v.literal("filler"),
      v.literal("consultation"),
    ),
    // Duplicate prevention settings
    preventDuplicates: v.optional(v.boolean()),
    duplicatePreventionDays: v.optional(v.number()), // Default 30 days
    // Enhanced conditions with more operators
    conditions: v.array(
      v.object({
        field: v.string(),
        operator: v.union(
          v.literal("equals"),
          v.literal("contains"),
          v.literal("greater_than"),
          v.literal("less_than"),
          v.literal("greater_than_or_equal"),
          v.literal("less_than_or_equal"),
          v.literal("not_equals"),
          v.literal("is_empty"),
          v.literal("is_not_empty"),
          v.literal("date_before"),
          v.literal("date_after"),
          v.literal("days_ago"),
          v.literal("has_tag"),
          v.literal("not_has_tag"),
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
          v.literal("create_appointment"),
          v.literal("add_note"),
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
          comments: v.optional(v.string()), // Comments on nodes
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
    // Execution statistics
    totalRuns: v.optional(v.number()),
    successfulRuns: v.optional(v.number()),
    failedRuns: v.optional(v.number()),
    lastRun: v.optional(v.number()),
    averageExecutionTime: v.optional(v.number()), // in milliseconds
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_directory", ["directoryId"])
    .index("by_trigger", ["trigger"])
    .index("by_status", ["status"]),

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

  // Workflow Enrollments - clients enrolled in workflows
  workflowEnrollments: defineTable({
    orgId: v.id("orgs"),
    workflowId: v.id("workflows"),
    clientId: v.id("clients"),
    enrollmentReason: v.string(), // "appointment_completed", "manual", etc.
    currentStatus: v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("failed"),
    ),
    currentStep: v.optional(v.string()), // Current node/step ID
    nextExecutionAt: v.optional(v.number()), // When next step should run
    enrolledAt: v.number(),
    completedAt: v.optional(v.number()),
    pausedAt: v.optional(v.number()),
    resumedAt: v.optional(v.number()),
    metadata: v.optional(v.any()), // Additional context data
  })
    .index("by_org", ["orgId"])
    .index("by_workflow", ["workflowId"])
    .index("by_client", ["clientId"])
    .index("by_status", ["currentStatus"])
    .index("by_next_execution", ["nextExecutionAt"]),

  // Execution Logs - detailed step-by-step execution tracking
  executionLogs: defineTable({
    orgId: v.id("orgs"),
    workflowId: v.id("workflows"),
    enrollmentId: v.id("workflowEnrollments"),
    clientId: v.id("clients"),
    stepId: v.string(), // Node/step identifier
    action: v.string(), // "send_sms", "send_email", "delay", etc.
    status: v.union(
      v.literal("executed"),
      v.literal("failed"),
      v.literal("skipped"),
      v.literal("retrying"),
    ),
    executedAt: v.number(),
    executionTimeMs: v.optional(v.number()), // How long the step took
    message: v.optional(v.string()), // Success/error message
    error: v.optional(v.string()), // Detailed error info
    metadata: v.optional(v.any()), // Step-specific data
  })
    .index("by_org", ["orgId"])
    .index("by_workflow", ["workflowId"])
    .index("by_enrollment", ["enrollmentId"])
    .index("by_client", ["clientId"])
    .index("by_status", ["status"])
    .index("by_executed_at", ["executedAt"]),

  workflowRuns: defineTable({
    workflowId: v.id("workflows"),
    clientId: v.id("clients"),
    currentNodeId: v.string(),
    status: v.string(),
  }).index("by_workflow", ["workflowId"]),

  // Appointment Workflow Triggers - track appointment-based enrollments
  appointmentTriggers: defineTable({
    orgId: v.id("orgs"),
    appointmentId: v.id("appointments"),
    clientId: v.id("clients"),
    appointmentType: v.string(), // "morpheus8", "toxins", etc.
    triggeredWorkflows: v.array(v.id("workflows")), // Workflows triggered
    enrollmentIds: v.array(v.id("workflowEnrollments")), // Created enrollments
    triggeredAt: v.number(),
    appointmentEndTime: v.number(),
    metadata: v.optional(v.any()),
  })
    .index("by_org", ["orgId"])
    .index("by_appointment", ["appointmentId"])
    .index("by_client", ["clientId"])
    .index("by_type", ["appointmentType"])
    .index("by_triggered_at", ["triggeredAt"]),

  // Workflow Executions - track workflow runs (keeping for backward compatibility)
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
      v.literal("youtube"),
      v.literal("google_business"),
      v.literal("tiktok"),
      v.literal("linkedin"),
      v.literal("apple_business"),
    ),
    accountName: v.string(),
    accountId: v.optional(v.string()), // Platform-specific account ID
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
    isConnected: v.boolean(),
    lastSync: v.optional(v.number()),
    profileImageUrl: v.optional(v.string()),
    followerCount: v.optional(v.number()),
    connectionError: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_platform", ["platform"])
    .index("by_connected", ["isConnected"]),

  // Social Media Posts - comprehensive post management
  socialPosts: defineTable({
    orgId: v.id("orgs"),
    title: v.string(),
    content: v.string(),
    hashtags: v.array(v.string()),
    // Media handling
    mediaFiles: v.array(
      v.object({
        url: v.string(),
        type: v.union(v.literal("image"), v.literal("video")),
        fileName: v.string(),
        fileSize: v.number(),
        mimeType: v.string(),
        // Platform-specific versions for auto-resizing
        versions: v.optional(
          v.array(
            v.object({
              platform: v.string(),
              url: v.string(),
              width: v.number(),
              height: v.number(),
              aspectRatio: v.string(), // "1:1", "16:9", "9:16", etc.
            }),
          ),
        ),
      }),
    ),
    // Platform targeting
    targetPlatforms: v.array(v.string()), // ["instagram", "facebook", etc.]
    platformSpecificContent: v.optional(
      v.array(
        v.object({
          platform: v.string(),
          content: v.string(),
          hashtags: v.array(v.string()),
        }),
      ),
    ),
    // Scheduling
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("publishing"),
      v.literal("published"),
      v.literal("failed"),
      v.literal("cancelled"),
    ),
    scheduledFor: v.optional(v.number()),
    timezone: v.optional(v.string()),
    // Publishing tracking
    publishingResults: v.optional(
      v.array(
        v.object({
          platform: v.string(),
          status: v.union(v.literal("success"), v.literal("failed")),
          externalPostId: v.optional(v.string()),
          error: v.optional(v.string()),
          publishedAt: v.optional(v.number()),
        }),
      ),
    ),
    // AI assistance
    aiSuggestedCaption: v.optional(v.string()),
    aiSuggestedHashtags: v.optional(v.array(v.string())),
    aiAnalysisResults: v.optional(
      v.object({
        imageDescription: v.optional(v.string()),
        suggestedTiming: v.optional(v.string()),
        estimatedEngagement: v.optional(v.number()),
      }),
    ),
    // Bulk/CSV import tracking
    bulkImportId: v.optional(v.string()),
    // User context
    createdBy: v.id("users"),
    lastEditedBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_status", ["status"])
    .index("by_scheduled", ["scheduledFor"])
    .index("by_created_by", ["createdBy"])
    .index("by_bulk_import", ["bulkImportId"]),

  // Social Media Analytics - comprehensive engagement metrics
  socialAnalytics: defineTable({
    orgId: v.id("orgs"),
    postId: v.id("socialPosts"),
    platform: v.union(
      v.literal("instagram"),
      v.literal("facebook"),
      v.literal("youtube"),
      v.literal("google_business"),
      v.literal("tiktok"),
      v.literal("linkedin"),
      v.literal("apple_business"),
    ),
    externalPostId: v.string(), // Platform's post ID
    // Basic metrics
    likes: v.number(),
    comments: v.number(),
    shares: v.number(),
    views: v.number(),
    // Advanced metrics
    impressions: v.optional(v.number()),
    reach: v.optional(v.number()),
    clicks: v.optional(v.number()),
    saves: v.optional(v.number()),
    engagement_rate: v.optional(v.number()),
    // Platform-specific metrics
    platform_specific: v.optional(
      v.object({
        // Instagram: story_views, profile_visits, website_clicks
        // TikTok: video_duration_watched, profile_views
        // LinkedIn: company_page_clicks, follow_clicks
        // YouTube: watch_time, subscribers_gained, average_view_duration
        metrics: v.any(),
      }),
    ),
    // Demographics (if available)
    demographics: v.optional(
      v.object({
        age_groups: v.optional(v.any()),
        genders: v.optional(v.any()),
        locations: v.optional(v.any()),
        devices: v.optional(v.any()),
      }),
    ),
    // Time-series data
    hourly_data: v.optional(
      v.array(
        v.object({
          hour: v.number(),
          views: v.number(),
          likes: v.number(),
          comments: v.number(),
        }),
      ),
    ),
    // Data collection metadata
    lastUpdated: v.number(),
    nextUpdate: v.optional(v.number()),
    isRealTime: v.boolean(), // Was this fetched real-time or from cache?
    createdAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_post", ["postId"])
    .index("by_platform", ["platform"])
    .index("by_external_post", ["externalPostId"])
    .index("by_last_updated", ["lastUpdated"]),

  // Bulk Import Jobs - track CSV/bulk post imports
  bulkImportJobs: defineTable({
    orgId: v.id("orgs"),
    userId: v.id("users"),
    jobId: v.string(), // Unique identifier
    fileName: v.string(),
    totalRows: v.number(),
    processedRows: v.number(),
    successfulRows: v.number(),
    failedRows: v.number(),
    status: v.union(
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled"),
    ),
    errors: v.array(
      v.object({
        row: v.number(),
        column: v.optional(v.string()),
        error: v.string(),
      }),
    ),
    createdPostIds: v.array(v.id("socialPosts")),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_org", ["orgId"])
    .index("by_user", ["userId"])
    .index("by_job_id", ["jobId"])
    .index("by_status", ["status"]),

  // Content Templates - reusable post templates
  contentTemplates: defineTable({
    orgId: v.id("orgs"),
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()), // "promotion", "before-after", "educational", etc.
    content: v.string(),
    hashtags: v.array(v.string()),
    defaultPlatforms: v.array(v.string()),
    // Template variables like {{client_name}}, {{service_name}}
    variables: v.array(
      v.object({
        name: v.string(),
        description: v.string(),
        required: v.boolean(),
        defaultValue: v.optional(v.string()),
      }),
    ),
    usageCount: v.number(),
    lastUsed: v.optional(v.number()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_category", ["category"])
    .index("by_created_by", ["createdBy"]),

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

  // Scheduled Actions - cron-like task scheduling
  scheduledActions: defineTable({
    orgId: v.id("orgs"),
    action: v.string(), // "processAppointmentCompletion", "syncCalendar", etc.
    args: v.any(), // Action arguments
    scheduledFor: v.number(), // When to execute
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    attempts: v.number(),
    maxAttempts: v.optional(v.number()),
    lastAttempt: v.optional(v.number()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_status", ["status"])
    .index("by_scheduled_for", ["scheduledFor"]),

  // OTP Codes - for two-factor authentication
  otpCodes: defineTable({
    userId: v.id("users"),
    code: v.string(), // 6-digit code
    type: v.union(
      v.literal("login"),
      v.literal("verification"),
      v.literal("password_reset"),
    ),
    deliveryMethod: v.union(v.literal("sms"), v.literal("email")),
    deliveryTarget: v.string(), // Phone number or email address
    isUsed: v.boolean(),
    attempts: v.number(), // Number of verification attempts
    maxAttempts: v.number(), // Maximum allowed attempts (default 3)
    expiresAt: v.number(), // 10 minutes from creation
    createdAt: v.number(),
    usedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_code", ["code"])
    .index("by_expiry", ["expiresAt"])
    .index("by_user_type", ["userId", "type"]),

  // User Sessions - for session management
  userSessions: defineTable({
    userId: v.id("users"),
    sessionToken: v.string(), // JWT or random token
    refreshToken: v.optional(v.string()),
    deviceInfo: v.optional(
      v.object({
        userAgent: v.string(),
        ip: v.string(),
        deviceName: v.optional(v.string()),
      }),
    ),
    isActive: v.boolean(),
    expiresAt: v.number(),
    lastUsedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_token", ["sessionToken"])
    .index("by_refresh_token", ["refreshToken"])
    .index("by_expiry", ["expiresAt"]),

  // Authentication Events - audit log for security
  authEvents: defineTable({
    userId: v.optional(v.id("users")), // Optional because failed logins won't have userId
    email: v.string(),
    eventType: v.union(
      v.literal("login_success"),
      v.literal("login_failed"),
      v.literal("otp_sent"),
      v.literal("otp_verified"),
      v.literal("otp_failed"),
      v.literal("password_reset"),
      v.literal("account_created"),
      v.literal("logout"),
    ),
    method: v.union(v.literal("email"), v.literal("google"), v.literal("otp")),
    deviceInfo: v.optional(
      v.object({
        userAgent: v.string(),
        ip: v.string(),
        deviceName: v.optional(v.string()),
      }),
    ),
    metadata: v.optional(v.any()), // Additional event-specific data
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_email", ["email"])
    .index("by_event_type", ["eventType"])
    .index("by_created_at", ["createdAt"]),

  // User Integrations - store OAuth tokens for external services
  userIntegrations: defineTable({
    userId: v.id("users"),
    orgId: v.id("orgs"),
    platform: v.union(
      v.literal("instagram"),
      v.literal("facebook"),
      v.literal("youtube"),
      v.literal("linkedin"),
      v.literal("tiktok"),
      v.literal("google_business"),
      v.literal("apple_business"),
      v.literal("google_calendar"),
      v.literal("stripe"),
      v.literal("twilio"),
      v.literal("mailchimp"),
      v.literal("aws_s3"),
    ),
    accountId: v.optional(v.string()), // Platform-specific account ID
    accountName: v.optional(v.string()), // Display name
    accountEmail: v.optional(v.string()),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    tokenType: v.optional(v.string()), // "Bearer", etc.
    scopes: v.optional(v.array(v.string())), // OAuth scopes granted
    expiresAt: v.optional(v.number()),
    isActive: v.boolean(),
    lastSync: v.optional(v.number()),
    syncError: v.optional(v.string()),
    profileData: v.optional(v.any()), // Platform-specific profile info
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_org", ["orgId"])
    .index("by_platform", ["platform"])
    .index("by_user_platform", ["userId", "platform"])
    .index("by_active", ["isActive"]),

  // Team Members - manage organization team with roles
  teamMembers: defineTable({
    orgId: v.id("orgs"),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("manager"), v.literal("staff")),
    status: v.union(
      v.literal("active"),
      v.literal("invited"),
      v.literal("suspended"),
      v.literal("deactivated"),
    ),
    invitedBy: v.optional(v.id("users")),
    invitedAt: v.optional(v.number()),
    joinedAt: v.optional(v.number()),
    lastAccessAt: v.optional(v.number()),
    inviteToken: v.optional(v.string()), // For email invitations
    inviteExpiresAt: v.optional(v.number()),
    // Custom permissions override (if different from role defaults)
    customPermissions: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_user", ["userId"])
    .index("by_role", ["role"])
    .index("by_status", ["status"])
    .index("by_invite_token", ["inviteToken"]),

  // Permissions - define granular permissions system
  permissions: defineTable({
    orgId: v.id("orgs"),
    userId: v.id("users"),
    resource: v.union(
      // Page-level permissions
      v.literal("dashboard"),
      v.literal("workflows"),
      v.literal("clients"),
      v.literal("appointments"),
      v.literal("gallery"),
      v.literal("messages"),
      v.literal("templates"),
      v.literal("social_media"),
      v.literal("analytics"),
      v.literal("team"),
      v.literal("inventory"),
      v.literal("reviews"),
      v.literal("settings"),
      // Feature-level permissions
      v.literal("create_workflow"),
      v.literal("edit_workflow"),
      v.literal("delete_workflow"),
      v.literal("create_client"),
      v.literal("edit_client"),
      v.literal("delete_client"),
      v.literal("create_appointment"),
      v.literal("edit_appointment"),
      v.literal("delete_appointment"),
      v.literal("send_messages"),
      v.literal("view_analytics"),
      v.literal("manage_team"),
      v.literal("manage_integrations"),
      v.literal("manage_billing"),
      v.literal("export_data"),
    ),
    action: v.union(
      v.literal("read"),
      v.literal("create"),
      v.literal("update"),
      v.literal("delete"),
      v.literal("execute"),
      v.literal("manage"),
    ),
    granted: v.boolean(),
    grantedBy: v.optional(v.id("users")), // Who granted this permission
    reason: v.optional(v.string()), // Why this permission was granted/denied
    expiresAt: v.optional(v.number()), // For temporary permissions
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_user", ["userId"])
    .index("by_resource", ["resource"])
    .index("by_user_resource", ["userId", "resource"])
    .index("by_granted", ["granted"]),

  // Audit Logs - comprehensive security and activity logging
  auditLogs: defineTable({
    orgId: v.id("orgs"),
    userId: v.optional(v.id("users")), // Optional for system events
    action: v.union(
      // Authentication
      v.literal("login"),
      v.literal("logout"),
      v.literal("login_failed"),
      v.literal("password_reset"),
      v.literal("two_factor_enabled"),
      v.literal("two_factor_disabled"),
      // User management
      v.literal("user_created"),
      v.literal("user_updated"),
      v.literal("user_deactivated"),
      v.literal("user_invited"),
      // Permissions
      v.literal("permission_granted"),
      v.literal("permission_revoked"),
      v.literal("role_changed"),
      v.literal("user_role_changed"),
      // Data operations
      v.literal("client_created"),
      v.literal("client_updated"),
      v.literal("client_deleted"),
      v.literal("workflow_created"),
      v.literal("workflow_updated"),
      v.literal("workflow_deleted"),
      v.literal("workflow_executed"),
      // Settings changes
      v.literal("settings_updated"),
      v.literal("integration_connected"),
      v.literal("integration_disconnected"),
      v.literal("billing_updated"),
      // Security events
      v.literal("suspicious_activity"),
      v.literal("vpn_detected"),
      v.literal("multiple_failed_logins"),
      v.literal("data_export"),
    ),
    target: v.optional(v.string()), // Resource that was affected (client ID, workflow ID, etc.)
    details: v.optional(v.any()), // Additional details about the action
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    deviceInfo: v.optional(
      v.object({
        browser: v.optional(v.string()),
        os: v.optional(v.string()),
        device: v.optional(v.string()),
      }),
    ),
    location: v.optional(
      v.object({
        country: v.optional(v.string()),
        region: v.optional(v.string()),
        city: v.optional(v.string()),
        timezone: v.optional(v.string()),
      }),
    ),
    riskLevel: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical"),
    ),
    isVpnDetected: v.optional(v.boolean()),
    sessionId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_user", ["userId"])
    .index("by_action", ["action"])
    .index("by_risk_level", ["riskLevel"])
    .index("by_created_at", ["createdAt"])
    .index("by_ip", ["ipAddress"])
    .index("by_vpn", ["isVpnDetected"]),
});
