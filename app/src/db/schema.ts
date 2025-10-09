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
  name: varchar("name", { length: 256 }).notNull(),
  role: mysqlEnum("role", ["admin", "manager", "staff"]).notNull(),
  avatar: varchar("avatar", { length: 256 }),
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
