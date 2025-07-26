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
	}).index("by_org", ["orgId"]).index("by_email", ["email"]),

	// Clients - aesthetic customers
	clients: defineTable({
		orgId: v.id("orgs"),
		fullName: v.string(),
		gender: v.union(v.literal("male"), v.literal("female"), v.literal("other")),
		dateOfBirth: v.optional(v.string()),
		phones: v.array(v.string()),
		email: v.optional(v.string()),
		tags: v.array(v.string()),
		address: v.optional(v.object({
			street: v.string(),
			city: v.string(),
			state: v.string(),
			zip: v.string(),
		})),
		referralSource: v.optional(v.string()),
		clientPortalStatus: v.union(
			v.literal("active"),
			v.literal("inactive"),
			v.literal("pending")
		),
		profileImageUrl: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_org", ["orgId"]).index("by_email", ["email"]),

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
			v.literal("no_show")
		),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_org", ["orgId"]).index("by_client", ["clientId"]).index("by_date", ["dateTime"]),

	// Notes - tagged notes for clients
	notes: defineTable({
		orgId: v.id("orgs"),
		clientId: v.id("clients"),
		authorId: v.id("users"),
		text: v.string(),
		tag: v.string(), // goal, outcome, general, etc.
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_org", ["orgId"]).index("by_client", ["clientId"]).index("by_tag", ["tag"]),

	// Workflows - automation logic
	workflows: defineTable({
		orgId: v.id("orgs"),
		name: v.string(),
		description: v.optional(v.string()),
		trigger: v.union(
			v.literal("new_client"),
			v.literal("appointment_completed"),
			v.literal("appointment_scheduled"),
			v.literal("manual")
		),
		conditions: v.array(v.object({
			field: v.string(),
			operator: v.union(v.literal("equals"), v.literal("contains"), v.literal("greater_than")),
			value: v.string(),
		})),
		actions: v.array(v.object({
			type: v.union(
				v.literal("send_sms"),
				v.literal("send_email"),
				v.literal("delay"),
				v.literal("tag"),
				v.literal("conditional")
			),
			config: v.any(),
			order: v.number(),
		})),
		isActive: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_org", ["orgId"]).index("by_trigger", ["trigger"]),

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
	}).index("by_org", ["orgId"]).index("by_type", ["type"]),

	// Files - images/docs on S3
	files: defineTable({
		orgId: v.id("orgs"),
		clientId: v.id("clients"),
		key: v.string(), // S3 key
		filename: v.string(),
		type: v.string(),
		size: v.number(),
		cropData: v.optional(v.object({
			x: v.number(),
			y: v.number(),
			width: v.number(),
			height: v.number(),
		})),
		tag: v.string(), // before, after, reference, raw
		thumbnailUrl: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_org", ["orgId"]).index("by_client", ["clientId"]).index("by_tag", ["tag"]),

	// Messages - sent messages history
	messages: defineTable({
		orgId: v.id("orgs"),
		clientId: v.id("clients"),
		type: v.union(v.literal("sms"), v.literal("email")),
		content: v.string(),
		status: v.union(
			v.literal("sent"),
			v.literal("delivered"),
			v.literal("failed"),
			v.literal("pending")
		),
		externalId: v.optional(v.string()), // AWS SNS/SES message ID
		scheduledFor: v.optional(v.number()),
		sentAt: v.optional(v.number()),
		createdAt: v.number(),
	}).index("by_org", ["orgId"]).index("by_client", ["clientId"]).index("by_status", ["status"]),

	// Workflow Executions - track workflow runs
	workflowExecutions: defineTable({
		orgId: v.id("orgs"),
		workflowId: v.id("workflows"),
		clientId: v.id("clients"),
		status: v.union(
			v.literal("running"),
			v.literal("completed"),
			v.literal("failed"),
			v.literal("cancelled")
		),
		actionsCompleted: v.array(v.number()),
		error: v.optional(v.string()),
		startedAt: v.number(),
		completedAt: v.optional(v.number()),
	}).index("by_org", ["orgId"]).index("by_workflow", ["workflowId"]).index("by_client", ["clientId"]),
}); 