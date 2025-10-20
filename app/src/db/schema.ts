import {
  bigint,
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// Organizations
export const orgs = mysqlTable("orgs", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  logo: varchar("logo", { length: 256 }),
  settings: json("settings"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Users (team members)
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  orgId: bigint("org_id", { mode: "number", unsigned: true })
    .references(() => orgs.id)
    .notNull(),
  email: varchar("email", { length: 256 }).notNull().unique(),
  emailVerifiedAt: timestamp("email_verified_at"),
  password: varchar("password", { length: 512 }), // hashed password, nullable for OAuth users
  name: varchar("name", { length: 256 }).notNull(),
  role: mysqlEnum("role", ["owner", "admin", "manager", "staff"]).notNull(),
  avatar: varchar("avatar", { length: 256 }),
  phone: varchar("phone", { length: 50 }),
  phoneVerifiedAt: timestamp("phone_verified_at"),
  isMasterOwner: boolean("is_master_owner").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  loginAttempts: int("login_attempts").default(0).notNull(),
  lockedUntil: timestamp("locked_until"),
  lastLoginAt: timestamp("last_login_at"),
  lastLoginIp: varchar("last_login_ip", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Clients
export const clients = mysqlTable("clients", {
  id: serial("id").primaryKey(),
  orgId: bigint("org_id", { mode: "number", unsigned: true })
    .references(() => orgs.id)
    .notNull(),
  fullName: varchar("full_name", { length: 256 }).notNull(),
  email: varchar("email", { length: 256 }).notNull(),
  phones: json("phones").$type<string[]>(),
  gender: varchar("gender", { length: 50 }).notNull(),
  dateOfBirth: varchar("date_of_birth", { length: 50 }),
  address: text("address"),
  referralSource: varchar("referral_source", { length: 256 }).notNull(),
  tags: json("tags").$type<string[]>(),
  clientPortalStatus: varchar("client_portal_status", { length: 50 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Workflows
export const workflows = mysqlTable("workflows", {
  id: serial("id").primaryKey(),
  orgId: bigint("org_id", { mode: "number", unsigned: true })
    .references(() => orgs.id)
    .notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description").notNull(),
  trigger: varchar("trigger", { length: 256 }).notNull(),
  enabled: boolean("enabled").default(false).notNull(),
  directoryId: bigint("directory_id", { mode: "number", unsigned: true })
    .references(() => workflowDirectories.id),
  status: mysqlEnum("status", ["active", "inactive", "draft", "archived"]).default("draft").notNull(),
  blocks: json("blocks"),
  connections: json("connections"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  lastRun: timestamp("last_run"),
  runCount: int("run_count").default(0).notNull(),
});

// Workflow Enrollments
export const workflowEnrollments = mysqlTable("workflow_enrollments", {
  id: serial("id").primaryKey(),
  orgId: bigint("org_id", { mode: "number", unsigned: true })
    .references(() => orgs.id)
    .notNull(),
  workflowId: bigint("workflow_id", { mode: "number", unsigned: true })
    .references(() => workflows.id)
    .notNull(),
  clientId: bigint("client_id", { mode: "number", unsigned: true })
    .references(() => clients.id)
    .notNull(),
  enrollmentReason: varchar("enrollment_reason", { length: 256 }).notNull(),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  currentStep: varchar("current_step", { length: 256 }),
  currentStatus: mysqlEnum("current_status", [
    "active",
    "paused",
    "completed",
    "cancelled",
  ]).notNull(),
  nextExecutionAt: timestamp("next_execution_at"),
  completedAt: timestamp("completed_at"),
  metadata: json("metadata"),
});

// Execution Logs
export const executionLogs = mysqlTable("execution_logs", {
  id: serial("id").primaryKey(),
  orgId: bigint("org_id", { mode: "number", unsigned: true })
    .references(() => orgs.id)
    .notNull(),
  workflowId: bigint("workflow_id", { mode: "number", unsigned: true })
    .references(() => workflows.id)
    .notNull(),
  enrollmentId: bigint("enrollment_id", { mode: "number", unsigned: true })
    .references(() => workflowEnrollments.id)
    .notNull(),
  clientId: bigint("client_id", { mode: "number", unsigned: true })
    .references(() => clients.id)
    .notNull(),
  stepId: varchar("step_id", { length: 256 }).notNull(),
  action: varchar("action", { length: 256 }).notNull(),
  status: mysqlEnum("status", [
    "executed",
    "failed",
    "waiting",
    "cancelled",
  ]).notNull(),
  executedAt: timestamp("executed_at").defaultNow().notNull(),
  message: text("message"),
  metadata: json("metadata"),
});

// Appointments
export const appointments = mysqlTable("appointments", {
  id: serial("id").primaryKey(),
  orgId: bigint("org_id", { mode: "number", unsigned: true })
    .references(() => orgs.id)
    .notNull(),
  clientId: bigint("client_id", { mode: "number", unsigned: true })
    .references(() => clients.id)
    .notNull(),
  providerId: bigint("provider_id", { mode: "number", unsigned: true })
    .references(() => users.id)
    .notNull(),
  service: varchar("service", { length: 256 }).notNull(),
  dateTime: timestamp("date_time").notNull(),
  duration: int("duration").notNull(), // in minutes
  status: mysqlEnum("status", [
    "scheduled",
    "confirmed",
    "completed",
    "cancelled",
    "no_show",
  ]).notNull(),
  price: int("price").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Message Templates
export const messageTemplates = mysqlTable("message_templates", {
  id: serial("id").primaryKey(),
  orgId: bigint("org_id", { mode: "number", unsigned: true })
    .references(() => orgs.id)
    .notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  type: mysqlEnum("type", ["sms", "email"]).notNull(),
  subject: varchar("subject", { length: 256 }),
  content: text("content").notNull(),
  variables: json("variables").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Files (for client photos, etc.)
export const files = mysqlTable("files", {
  id: serial("id").primaryKey(),
  orgId: bigint("org_id", { mode: "number", unsigned: true })
    .references(() => orgs.id)
    .notNull(),
  clientId: bigint("client_id", { mode: "number", unsigned: true })
    .references(() => clients.id)
    .notNull(),
  filename: varchar("filename", { length: 256 }).notNull(),
  url: varchar("url", { length: 1024 }).notNull(),
  type: mysqlEnum("type", ["photo", "document"]).notNull(),
  tags: json("tags").$type<string[]>(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Social Media Platforms
export const socialPlatforms = mysqlTable("social_platforms", {
  id: serial("id").primaryKey(),
  orgId: bigint("org_id", { mode: "number", unsigned: true })
    .references(() => orgs.id)
    .notNull(),
  platform: mysqlEnum("platform", [
    "instagram",
    "facebook",
    "tiktok",
    "youtube",
  ]).notNull(),
  accountName: varchar("account_name", { length: 256 }).notNull(),
  accountId: varchar("account_id", { length: 256 }).notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true).notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Social Media Posts
export const socialPosts = mysqlTable("social_posts", {
  id: serial("id").primaryKey(),
  orgId: bigint("org_id", { mode: "number", unsigned: true })
    .references(() => orgs.id)
    .notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  content: text("content").notNull(),
  mediaUrls: json("media_urls").$type<string[]>(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  platforms: json("platforms").$type<string[]>(),
  status: mysqlEnum("status", [
    "draft",
    "scheduled",
    "published",
    "failed",
    "cancelled",
  ]).notNull(),
  platformPostIds: json("platform_post_ids"),
  errorMessage: text("error_message"),
  createdBy: bigint("created_by", { mode: "number", unsigned: true })
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  publishedAt: timestamp("published_at"),
});

// Social Media Analytics
export const socialAnalytics = mysqlTable("social_analytics", {
  id: serial("id").primaryKey(),
  orgId: bigint("org_id", { mode: "number", unsigned: true })
    .references(() => orgs.id)
    .notNull(),
  postId: bigint("post_id", { mode: "number", unsigned: true })
    .references(() => socialPosts.id)
    .notNull(),
  platform: varchar("platform", { length: 256 }).notNull(),
  platformPostId: varchar("platform_post_id", { length: 256 }).notNull(),
  likes: int("likes").default(0).notNull(),
  comments: int("comments").default(0).notNull(),
  shares: int("shares").default(0).notNull(),
  views: int("views").default(0).notNull(),
  engagement: int("engagement").default(0).notNull(),
  collectedAt: timestamp("collected_at").defaultNow().notNull(),
});

// Notifications
export const notifications = mysqlTable("notifications", {
  id: serial("id").primaryKey(),
  orgId: bigint("org_id", { mode: "number", unsigned: true })
    .references(() => orgs.id)
    .notNull(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).references(
    () => users.id,
  ),
  title: varchar("title", { length: 256 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", [
    "info",
    "success",
    "warning",
    "error",
    "update",
    "message",
    "appointment",
    "workflow",
    "client",
  ]).notNull(),
  read: boolean("read").default(false).notNull(),
  actionUrl: varchar("action_url", { length: 1024 }),
  actionText: varchar("action_text", { length: 256 }),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// User Sessions (device tracking)
export const userSessions = mysqlTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true })
    .references(() => users.id)
    .notNull(),
  sessionToken: varchar("session_token", { length: 512 }).notNull().unique(),
  deviceInfo: json("device_info"), // browser, OS, IP, etc.
  deviceName: varchar("device_name", { length: 256 }), // user-defined name
  ipAddress: varchar("ip_address", { length: 45 }).notNull(),
  userAgent: text("user_agent"),
  isActive: boolean("is_active").default(true).notNull(),
  lastActivityAt: timestamp("last_activity_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User Invitations
export const userInvitations = mysqlTable("user_invitations", {
  id: serial("id").primaryKey(),
  orgId: bigint("org_id", { mode: "number", unsigned: true })
    .references(() => orgs.id)
    .notNull(),
  email: varchar("email", { length: 256 }).notNull(),
  role: mysqlEnum("role", ["admin", "manager", "staff"]).notNull(),
  invitedBy: bigint("invited_by", { mode: "number", unsigned: true })
    .references(() => users.id)
    .notNull(),
  token: varchar("token", { length: 512 }).notNull().unique(),
  permissions: json("permissions").$type<string[]>(), // specific permissions to grant
  status: mysqlEnum("status", ["pending", "accepted", "expired", "cancelled"]).default("pending").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Permissions (available permissions in the system)
export const permissions = mysqlTable("permissions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull().unique(), // e.g. "clients.view", "workflows.create"
  description: varchar("description", { length: 512 }).notNull(),
  category: varchar("category", { length: 128 }).notNull(), // e.g. "clients", "workflows", "settings"
  isDefault: boolean("is_default").default(false).notNull(), // default for new users
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User Permissions (user-specific permission overrides)
export const userPermissions = mysqlTable("user_permissions", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true })
    .references(() => users.id)
    .notNull(),
  permissionId: bigint("permission_id", { mode: "number", unsigned: true })
    .references(() => permissions.id)
    .notNull(),
  granted: boolean("granted").notNull(), // true = granted, false = denied
  grantedBy: bigint("granted_by", { mode: "number", unsigned: true })
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Organization Permissions (master owner can disable features for entire orgs)
export const orgPermissions = mysqlTable("org_permissions", {
  id: serial("id").primaryKey(),
  orgId: bigint("org_id", { mode: "number", unsigned: true })
    .references(() => orgs.id)
    .notNull(),
  permissionId: bigint("permission_id", { mode: "number", unsigned: true })
    .references(() => permissions.id)
    .notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  disabledBy: bigint("disabled_by", { mode: "number", unsigned: true })
    .references(() => users.id),
  disabledAt: timestamp("disabled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Password Resets
export const passwordResets = mysqlTable("password_resets", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 256 }).notNull(),
  token: varchar("token", { length: 512 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Two Factor Authentication
export const twoFactorAuth = mysqlTable("two_factor_auth", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true })
    .references(() => users.id)
    .notNull()
    .unique(),
  secret: varchar("secret", { length: 512 }).notNull(), // encrypted TOTP secret
  backupCodes: json("backup_codes").$type<string[]>(), // encrypted backup codes
  isEnabled: boolean("is_enabled").default(false).notNull(),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Subscriptions (Stripe integration)
export const subscriptions = mysqlTable("subscriptions", {
  id: serial("id").primaryKey(),
  orgId: bigint("org_id", { mode: "number", unsigned: true })
    .references(() => orgs.id)
    .notNull()
    .unique(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 256 }).notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 256 }).notNull().unique(),
  stripePriceId: varchar("stripe_price_id", { length: 256 }).notNull(),
  status: mysqlEnum("status", [
    "active",
    "canceled",
    "incomplete",
    "incomplete_expired",
    "past_due",
    "trialing",
    "unpaid",
    "paused"
  ]).notNull(),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
  canceledAt: timestamp("canceled_at"),
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Usage Tracking (for analytics and billing)
export const usageTracking = mysqlTable("usage_tracking", {
  id: serial("id").primaryKey(),
  orgId: bigint("org_id", { mode: "number", unsigned: true })
    .references(() => orgs.id)
    .notNull(),
  userId: bigint("user_id", { mode: "number", unsigned: true })
    .references(() => users.id),
  metric: varchar("metric", { length: 128 }).notNull(), // e.g. "api_calls", "storage_used", "sms_sent"
  value: bigint("value", { mode: "number" }).notNull(),
  metadata: json("metadata"), // additional context like endpoint, file size, etc.
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD for daily aggregation
});

// Compliance Agreements (HIPAA, Terms, etc.)
export const complianceAgreements = mysqlTable("compliance_agreements", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true })
    .references(() => users.id)
    .notNull(),
  orgId: bigint("org_id", { mode: "number", unsigned: true })
    .references(() => orgs.id)
    .notNull(),
  agreementType: mysqlEnum("agreement_type", ["terms_of_service", "privacy_policy", "hipaa_agreement"]).notNull(),
  version: varchar("version", { length: 50 }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }).notNull(),
  userAgent: text("user_agent"),
  acceptedAt: timestamp("accepted_at").defaultNow().notNull(),
});

// Organization Invitations (for creating new orgs from master admin)
export const orgInvitations = mysqlTable("org_invitations", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 256 }).notNull(),
  orgName: varchar("org_name", { length: 256 }).notNull(),
  invitedBy: bigint("invited_by", { mode: "number", unsigned: true })
    .references(() => users.id)
    .notNull(),
  token: varchar("token", { length: 512 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "accepted", "expired", "cancelled"]).default("pending").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === NEW COMPREHENSIVE FEATURE SYSTEM TABLES ===

// Calendar Integration
export const calendarConnections = mysqlTable("calendar_connections", {
  id: serial("id").primaryKey(),
  orgId: bigint("org_id", { mode: "number", unsigned: true })
    .references(() => orgs.id)
    .notNull(),
  calendarId: varchar("calendar_id", { length: 256 }).notNull(), // Google Calendar ID
  calendarName: varchar("calendar_name", { length: 256 }).notNull(),
  ownerEmail: varchar("owner_email", { length: 256 }).notNull(),
  accessToken: text("access_token").notNull(), // encrypted
  refreshToken: text("refresh_token"), // encrypted
  isActive: boolean("is_active").default(true).notNull(),
  webhookId: varchar("webhook_id", { length: 256 }), // Google webhook ID
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const calendarSyncLog = mysqlTable("calendar_sync_log", {
  id: serial("id").primaryKey(),
  orgId: bigint("org_id", { mode: "number", unsigned: true })
    .references(() => orgs.id)
    .notNull(),
  calendarId: varchar("calendar_id", { length: 256 }).notNull(),
  syncedAt: timestamp("synced_at").defaultNow().notNull(),
  eventsProcessed: int("events_processed").default(0).notNull(),
  eventsCreated: int("events_created").default(0).notNull(),
  eventsUpdated: int("events_updated").default(0).notNull(),
  eventsDeleted: int("events_deleted").default(0).notNull(),
  errors: json("errors").$type<string[]>(),
  status: mysqlEnum("status", ["success", "partial", "failed"]).notNull(),
});

// Enhanced Appointments with Calendar Sync
export const appointmentCheckins = mysqlTable("appointment_checkins", {
  id: serial("id").primaryKey(),
  appointmentId: bigint("appointment_id", { mode: "number", unsigned: true })
    .references(() => appointments.id)
    .notNull(),
  status: mysqlEnum("status", [
    "scheduled",
    "shown", 
    "no_show",
    "late",
    "rescheduled",
    "cancelled"
  ]).notNull(),
  checkedInBy: bigint("checked_in_by", { mode: "number", unsigned: true })
    .references(() => users.id),
  checkedInAt: timestamp("checked_in_at").defaultNow().notNull(),
  notes: text("notes"),
  phoneNumberAdded: varchar("phone_number_added", { length: 50 }), // for new clients
  metadata: json("metadata"), // additional check-in data
});

export const appointmentSyncStatus = mysqlTable("appointment_sync_status", {
  id: serial("id").primaryKey(),
  appointmentId: bigint("appointment_id", { mode: "number", unsigned: true })
    .references(() => appointments.id)
    .notNull(),
  calendarEventId: varchar("calendar_event_id", { length: 256 }).notNull(),
  calendarId: varchar("calendar_id", { length: 256 }).notNull(),
  lastSyncedAt: timestamp("last_synced_at").defaultNow().notNull(),
  syncStatus: mysqlEnum("sync_status", ["synced", "pending", "failed", "conflict"]).notNull(),
  syncDirection: mysqlEnum("sync_direction", ["calendar_to_db", "db_to_calendar", "bidirectional"]).notNull(),
  conflictReason: text("conflict_reason"),
  metadata: json("metadata"),
});

// Smart Duplicate Detection System
export const potentialDuplicates = mysqlTable("potential_duplicates", {
  id: serial("id").primaryKey(),
  clientId: bigint("client_id", { mode: "number", unsigned: true })
    .references(() => clients.id)
    .notNull(),
  suspectedDuplicateId: bigint("suspected_duplicate_id", { mode: "number", unsigned: true })
    .references(() => clients.id)
    .notNull(),
  matchType: mysqlEnum("match_type", ["email", "phone", "name", "combined"]).notNull(),
  confidence: int("confidence").notNull(), // 0-100 confidence score
  matchingFields: json("matching_fields").$type<{
    email?: boolean;
    phone?: boolean; 
    firstName?: boolean;
    lastName?: boolean;
    dateOfBirth?: boolean;
  }>(),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: bigint("resolved_by", { mode: "number", unsigned: true })
    .references(() => users.id),
  resolution: mysqlEnum("resolution", ["merged", "not_duplicate", "ignored"]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Communication Preferences & Opt-outs
export const clientCommunicationPreferences = mysqlTable("client_communication_preferences", {
  id: serial("id").primaryKey(),
  clientId: bigint("client_id", { mode: "number", unsigned: true })
    .references(() => clients.id)
    .notNull()
    .unique(),
  smsOptOut: boolean("sms_opt_out").default(false).notNull(),
  emailOptOut: boolean("email_opt_out").default(false).notNull(),
  marketingOptOut: boolean("marketing_opt_out").default(false).notNull(),
  workflowOptOut: boolean("workflow_opt_out").default(false).notNull(),
  preferredProvider: mysqlEnum("preferred_provider", ["aws", "mailchimp"]).default("aws").notNull(),
  optOutDate: timestamp("opt_out_date"),
  optOutReason: text("opt_out_reason"),
  optOutSource: varchar("opt_out_source", { length: 256 }), // which message/campaign caused opt-out
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Enhanced Message Templates & Variables System
export const templateVariables = mysqlTable("template_variables", {
  id: serial("id").primaryKey(),
  orgId: bigint("org_id", { mode: "number", unsigned: true })
    .references(() => orgs.id)
    .notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  variableKey: varchar("variable_key", { length: 256 }).notNull(), // e.g. "firstName", "customField1"
  defaultValue: text("default_value"),
  isCustom: boolean("is_custom").default(false).notNull(), // true for org-created variables
  isSystem: boolean("is_system").default(false).notNull(), // true for built-in variables
  dataType: mysqlEnum("data_type", ["string", "number", "date", "boolean"]).default("string").notNull(),
  createdBy: bigint("created_by", { mode: "number", unsigned: true })
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Enhanced Message Templates (replacing basic messageTemplates)
export const enhancedMessageTemplates = mysqlTable("enhanced_message_templates", {
  id: serial("id").primaryKey(),
  orgId: bigint("org_id", { mode: "number", unsigned: true })
    .references(() => orgs.id)
    .notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["sms", "email"]).notNull(),
  subject: varchar("subject", { length: 256 }), // for email templates
  content: text("content").notNull(),
  variables: json("variables").$type<string[]>(), // array of variable keys used
  imageUrl: varchar("image_url", { length: 1024 }), // for templates with images
  isActive: boolean("is_active").default(true).notNull(),
  category: varchar("category", { length: 128 }), // e.g. "appointment_reminder", "follow_up"
  usageCount: int("usage_count").default(0).notNull(),
  lastUsedAt: timestamp("last_used_at"),
  createdBy: bigint("created_by", { mode: "number", unsigned: true })
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const messageCampaigns = mysqlTable("message_campaigns", {
  id: serial("id").primaryKey(),
  orgId: bigint("org_id", { mode: "number", unsigned: true })
    .references(() => orgs.id)
    .notNull(),
  templateId: bigint("template_id", { mode: "number", unsigned: true })
    .references(() => enhancedMessageTemplates.id),
  name: varchar("name", { length: 256 }).notNull(),
  type: mysqlEnum("type", ["bulk", "workflow", "manual"]).notNull(),
  recipientCount: int("recipient_count").default(0).notNull(),
  successCount: int("success_count").default(0).notNull(),
  failureCount: int("failure_count").default(0).notNull(),
  status: mysqlEnum("status", ["draft", "queued", "sending", "completed", "failed", "cancelled"]).notNull(),
  scheduledAt: timestamp("scheduled_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdBy: bigint("created_by", { mode: "number", unsigned: true })
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Message Delivery Tracking System
export const messageDeliveries = mysqlTable("message_deliveries", {
  id: serial("id").primaryKey(),
  orgId: bigint("org_id", { mode: "number", unsigned: true })
    .references(() => orgs.id)
    .notNull(),
  clientId: bigint("client_id", { mode: "number", unsigned: true })
    .references(() => clients.id)
    .notNull(),
  campaignId: bigint("campaign_id", { mode: "number", unsigned: true })
    .references(() => messageCampaigns.id),
  templateId: bigint("template_id", { mode: "number", unsigned: true })
    .references(() => enhancedMessageTemplates.id),
  workflowId: bigint("workflow_id", { mode: "number", unsigned: true })
    .references(() => workflowEnrollments.id),
  channel: mysqlEnum("channel", ["sms", "email"]).notNull(),
  provider: mysqlEnum("provider", ["aws_sns", "aws_ses", "mailchimp"]).notNull(),
  recipientEmail: varchar("recipient_email", { length: 256 }),
  recipientPhone: varchar("recipient_phone", { length: 50 }),
  subject: varchar("subject", { length: 256 }), // for emails
  content: text("content").notNull(), // final rendered content
  status: mysqlEnum("status", [
    "queued",
    "sent", 
    "delivered",
    "failed",
    "bounced",
    "complained",
    "unsubscribed"
  ]).notNull(),
  externalId: varchar("external_id", { length: 256 }), // provider's message ID
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"), // for emails
  clickedAt: timestamp("clicked_at"), // for links in messages
  errorMessage: text("error_message"),
  retryCount: int("retry_count").default(0).notNull(),
  metadata: json("metadata"), // provider-specific data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Enhanced Workflow System
export const workflowTriggers = mysqlTable("workflow_triggers", {
  id: serial("id").primaryKey(),
  workflowId: bigint("workflow_id", { mode: "number", unsigned: true })
    .references(() => workflows.id)
    .notNull(),
  triggerType: mysqlEnum("trigger_type", [
    "appointment_completed",
    "appointment_no_show", 
    "appointment_late",
    "appointment_rescheduled",
    "appointment_cancelled",
    "client_created",
    "tag_added",
    "tag_removed",
    "custom_date",
    "manual"
  ]).notNull(),
  conditions: json("conditions").$type<{
    appointmentType?: string[];
    clientTags?: string[];
    daysSinceLastVisit?: number;
    minimumVisits?: number;
    maximumVisits?: number;
    ageRange?: { min?: number; max?: number };
    customFields?: Record<string, any>;
  }>(),
  isActive: boolean("is_active").default(true).notNull(),
  priority: int("priority").default(0).notNull(), // for trigger ordering
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const workflowEnrollmentsHistory = mysqlTable("workflow_enrollments_history", {
  id: serial("id").primaryKey(),
  enrollmentId: bigint("enrollment_id", { mode: "number", unsigned: true })
    .references(() => workflowEnrollments.id)
    .notNull(),
  workflowId: bigint("workflow_id", { mode: "number", unsigned: true })
    .references(() => workflows.id)
    .notNull(),
  clientId: bigint("client_id", { mode: "number", unsigned: true })
    .references(() => clients.id)
    .notNull(),
  action: mysqlEnum("action", [
    "enrolled",
    "cancelled",
    "completed", 
    "paused",
    "resumed",
    "failed"
  ]).notNull(),
  reason: text("reason"), // why this action was taken
  triggeredBy: varchar("triggered_by", { length: 256 }), // what caused this action
  previousStatus: varchar("previous_status", { length: 50 }),
  newStatus: varchar("new_status", { length: 50 }),
  metadata: json("metadata"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Saved Client Filters
export const savedClientFilters = mysqlTable("saved_client_filters", {
  id: serial("id").primaryKey(),
  orgId: bigint("org_id", { mode: "number", unsigned: true })
    .references(() => orgs.id)
    .notNull(),
  userId: bigint("user_id", { mode: "number", unsigned: true })
    .references(() => users.id),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  filterCriteria: json("filter_criteria").$type<{
    tags?: string[];
    appointmentTypes?: string[];
    dateRange?: { start: string; end: string };
    communicationPreferences?: string[];
    lastVisitDays?: number;
    totalVisits?: { min?: number; max?: number };
    ageRange?: { min?: number; max?: number };
    gender?: string[];
    referralSource?: string[];
  }>(),
  isShared: boolean("is_shared").default(false).notNull(), // shared with org
  usageCount: int("usage_count").default(0).notNull(),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Time Zone Management
export const orgTimeZones = mysqlTable("org_time_zones", {
  id: serial("id").primaryKey(),
  orgId: bigint("org_id", { mode: "number", unsigned: true })
    .references(() => orgs.id)
    .notNull()
    .unique(),
  timeZone: varchar("time_zone", { length: 128 }).default("America/Denver").notNull(), // Mountain Time default
  dateFormat: varchar("date_format", { length: 50 }).default("MM/dd/yyyy").notNull(),
  timeFormat: varchar("time_format", { length: 50 }).default("h:mm a").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Workflow Directories for File System Organization
export const workflowDirectories = mysqlTable("workflow_directories", {
  id: serial("id").primaryKey(),
  orgId: bigint("org_id", { mode: "number", unsigned: true })
    .references(() => orgs.id)
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  parentId: bigint("parent_id", { mode: "number", unsigned: true })
    .references(() => workflowDirectories.id),
  color: varchar("color", { length: 20 }).default("#6366f1"),
  isArchived: boolean("is_archived").default(false).notNull(),
  position: int("position").default(0).notNull(),
  createdBy: bigint("created_by", { mode: "number", unsigned: true })
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
