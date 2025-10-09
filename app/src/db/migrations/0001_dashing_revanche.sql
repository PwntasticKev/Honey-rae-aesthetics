ALTER TABLE `appointments` MODIFY COLUMN `org_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `appointments` MODIFY COLUMN `client_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `appointments` MODIFY COLUMN `provider_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `clients` MODIFY COLUMN `org_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `execution_logs` MODIFY COLUMN `org_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `execution_logs` MODIFY COLUMN `workflow_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `execution_logs` MODIFY COLUMN `enrollment_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `execution_logs` MODIFY COLUMN `client_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `files` MODIFY COLUMN `org_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `files` MODIFY COLUMN `client_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `message_templates` MODIFY COLUMN `org_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `org_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `user_id` bigint unsigned;--> statement-breakpoint
ALTER TABLE `social_analytics` MODIFY COLUMN `org_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `social_analytics` MODIFY COLUMN `post_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `social_platforms` MODIFY COLUMN `org_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `social_posts` MODIFY COLUMN `org_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `social_posts` MODIFY COLUMN `created_by` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `org_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `workflow_enrollments` MODIFY COLUMN `org_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `workflow_enrollments` MODIFY COLUMN `workflow_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `workflow_enrollments` MODIFY COLUMN `client_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `workflows` MODIFY COLUMN `org_id` bigint unsigned NOT NULL;