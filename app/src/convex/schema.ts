import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	// Organizations
	orgs: defineTable({
		name: v.string(),
		slug: v.string(),
		logo: v.optional(v.string()),
		settings: v.optional(v.any()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_slug", ["slug"])
		.index("by_created", ["createdAt"]),

	// Users (team members)
	users: defineTable({
		orgId: v.id("orgs"),
		email: v.string(),
		name: v.string(),
		role: v.string(), // admin, manager, staff
		avatar: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_org", ["orgId"])
		.index("by_email", ["email"]),

	// Clients
	clients: defineTable({
		orgId: v.id("orgs"),
		fullName: v.string(),
		email: v.string(),
		phones: v.array(v.string()),
		gender: v.string(),
		dateOfBirth: v.optional(v.string()),
		address: v.optional(v.string()),
		referralSource: v.string(),
		tags: v.array(v.string()),
		clientPortalStatus: v.string(),
		notes: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_org", ["orgId"])
		.index("by_email", ["email"])
		.index("by_created", ["createdAt"]),

	// Workflows
	workflows: defineTable({
		orgId: v.id("orgs"),
		name: v.string(),
		description: v.string(),
		trigger: v.string(),
		enabled: v.boolean(),
		blocks: v.array(v.any()), // Workflow blocks/nodes
		connections: v.array(v.any()), // Workflow connections/edges
		createdAt: v.number(),
		updatedAt: v.number(),
		lastRun: v.optional(v.number()),
		runCount: v.number(),
	})
		.index("by_org", ["orgId"])
		.index("by_enabled", ["enabled"])
		.index("by_created", ["createdAt"]),

	// Workflow Enrollments (when a client enters a workflow)
	workflowEnrollments: defineTable({
		orgId: v.id("orgs"),
		workflowId: v.id("workflows"),
		clientId: v.id("clients"),
		enrollmentReason: v.string(), // e.g., "appointment_completed", "client_added"
		enrolledAt: v.number(),
		currentStep: v.optional(v.string()), // Current step ID
		currentStatus: v.string(), // "active", "paused", "completed", "cancelled"
		nextExecutionAt: v.optional(v.number()),
		completedAt: v.optional(v.number()),
		metadata: v.optional(v.any()), // Additional enrollment data
	})
		.index("by_org", ["orgId"])
		.index("by_workflow", ["workflowId"])
		.index("by_client", ["clientId"])
		.index("by_status", ["currentStatus"])
		.index("by_enrolled", ["enrolledAt"]),

	// Execution Logs (individual actions executed within workflows)
	executionLogs: defineTable({
		orgId: v.id("orgs"),
		workflowId: v.id("workflows"),
		enrollmentId: v.id("workflowEnrollments"),
		clientId: v.id("clients"),
		stepId: v.string(), // Which workflow step was executed
		action: v.string(), // e.g., "send_sms", "send_email", "add_tag", "wait"
		status: v.string(), // "executed", "failed", "waiting", "cancelled"
		executedAt: v.number(),
		message: v.optional(v.string()), // Success/error message
		metadata: v.optional(v.any()), // Additional execution data
	})
		.index("by_org", ["orgId"])
		.index("by_workflow", ["workflowId"])
		.index("by_enrollment", ["enrollmentId"])
		.index("by_client", ["clientId"])
		.index("by_status", ["status"])
		.index("by_executed", ["executedAt"]),

	// Appointments
	appointments: defineTable({
		orgId: v.id("orgs"),
		clientId: v.id("clients"),
		providerId: v.id("users"),
		service: v.string(),
		dateTime: v.number(),
		duration: v.number(), // in minutes
		status: v.string(), // "scheduled", "confirmed", "completed", "cancelled", "no_show"
		price: v.number(),
		notes: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_org", ["orgId"])
		.index("by_client", ["clientId"])
		.index("by_provider", ["providerId"])
		.index("by_datetime", ["dateTime"])
		.index("by_status", ["status"]),

	// Message Templates
	messageTemplates: defineTable({
		orgId: v.id("orgs"),
		name: v.string(),
		type: v.string(), // "sms", "email"
		subject: v.optional(v.string()), // for emails
		content: v.string(),
		variables: v.array(v.string()), // e.g., ["{{first_name}}", "{{appointment_date}}"]
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_org", ["orgId"])
		.index("by_type", ["type"])
		.index("by_created", ["createdAt"]),

	// Files (for client photos, etc.)
	files: defineTable({
		orgId: v.id("orgs"),
		clientId: v.id("clients"),
		filename: v.string(),
		url: v.string(),
		type: v.string(), // "photo", "document"
		tags: v.array(v.string()), // e.g., ["before", "after", "inspiration"]
		metadata: v.optional(v.any()), // crop coordinates, etc.
		createdAt: v.number(),
	})
		.index("by_org", ["orgId"])
		.index("by_client", ["clientId"])
		.index("by_type", ["type"])
		.index("by_created", ["createdAt"]),

	// Social Media Platforms (connected accounts)
	socialPlatforms: defineTable({
		orgId: v.id("orgs"),
		platform: v.string(), // "instagram", "facebook", "tiktok", "youtube"
		accountName: v.string(),
		accountId: v.string(),
		accessToken: v.string(),
		refreshToken: v.optional(v.string()),
		expiresAt: v.optional(v.number()),
		isActive: v.boolean(),
		metadata: v.optional(v.any()), // Platform-specific data
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_org", ["orgId"])
		.index("by_platform", ["platform"])
		.index("by_active", ["isActive"]),

	// Social Media Posts
	socialPosts: defineTable({
		orgId: v.id("orgs"),
		title: v.string(),
		content: v.string(),
		mediaUrls: v.array(v.string()), // Array of image/video URLs
		scheduledAt: v.number(), // Unix timestamp
		platforms: v.array(v.string()), // ["instagram", "facebook", "tiktok", "youtube"]
		status: v.string(), // "draft", "scheduled", "published", "failed", "cancelled"
		platformPostIds: v.optional(v.any()), // Store platform-specific post IDs after publishing
		errorMessage: v.optional(v.string()),
		createdBy: v.id("users"),
		createdAt: v.number(),
		updatedAt: v.number(),
		publishedAt: v.optional(v.number()),
	})
		.index("by_org", ["orgId"])
		.index("by_status", ["status"])
		.index("by_scheduled", ["scheduledAt"])
		.index("by_platforms", ["platforms"])
		.index("by_created", ["createdAt"]),

	// Social Media Analytics
	socialAnalytics: defineTable({
		orgId: v.id("orgs"),
		postId: v.id("socialPosts"),
		platform: v.string(),
		platformPostId: v.string(),
		likes: v.number(),
		comments: v.number(),
		shares: v.number(),
		views: v.number(),
		engagement: v.number(), // Calculated engagement rate
		collectedAt: v.number(),
	})
		.index("by_org", ["orgId"])
		.index("by_post", ["postId"])
		.index("by_platform", ["platform"])
		.index("by_collected", ["collectedAt"]),

	// Notifications
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
			v.literal("update"),
			v.literal("message"),
			v.literal("appointment"),
			v.literal("workflow"),
			v.literal("client")
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
}); 