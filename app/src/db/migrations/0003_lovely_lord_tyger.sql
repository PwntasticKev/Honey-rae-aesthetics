CREATE TABLE `appointment_checkins` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`appointment_id` bigint unsigned NOT NULL,
	`status` enum('scheduled','shown','no_show','late','rescheduled','cancelled') NOT NULL,
	`checked_in_by` bigint unsigned,
	`checked_in_at` timestamp NOT NULL DEFAULT (now()),
	`notes` text,
	`phone_number_added` varchar(50),
	`metadata` json,
	CONSTRAINT `appointment_checkins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `appointment_sync_status` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`appointment_id` bigint unsigned NOT NULL,
	`calendar_event_id` varchar(256) NOT NULL,
	`calendar_id` varchar(256) NOT NULL,
	`last_synced_at` timestamp NOT NULL DEFAULT (now()),
	`sync_status` enum('synced','pending','failed','conflict') NOT NULL,
	`sync_direction` enum('calendar_to_db','db_to_calendar','bidirectional') NOT NULL,
	`conflict_reason` text,
	`metadata` json,
	CONSTRAINT `appointment_sync_status_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calendar_connections` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`org_id` bigint unsigned NOT NULL,
	`calendar_id` varchar(256) NOT NULL,
	`calendar_name` varchar(256) NOT NULL,
	`owner_email` varchar(256) NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`webhook_id` varchar(256),
	`last_sync_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calendar_connections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calendar_sync_log` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`org_id` bigint unsigned NOT NULL,
	`calendar_id` varchar(256) NOT NULL,
	`synced_at` timestamp NOT NULL DEFAULT (now()),
	`events_processed` int NOT NULL DEFAULT 0,
	`events_created` int NOT NULL DEFAULT 0,
	`events_updated` int NOT NULL DEFAULT 0,
	`events_deleted` int NOT NULL DEFAULT 0,
	`errors` json,
	`status` enum('success','partial','failed') NOT NULL,
	CONSTRAINT `calendar_sync_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_communication_preferences` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`client_id` bigint unsigned NOT NULL,
	`sms_opt_out` boolean NOT NULL DEFAULT false,
	`email_opt_out` boolean NOT NULL DEFAULT false,
	`marketing_opt_out` boolean NOT NULL DEFAULT false,
	`workflow_opt_out` boolean NOT NULL DEFAULT false,
	`preferred_provider` enum('aws','mailchimp') NOT NULL DEFAULT 'aws',
	`opt_out_date` timestamp,
	`opt_out_reason` text,
	`opt_out_source` varchar(256),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_communication_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `client_communication_preferences_client_id_unique` UNIQUE(`client_id`)
);
--> statement-breakpoint
CREATE TABLE `enhanced_message_templates` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`org_id` bigint unsigned NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` text,
	`type` enum('sms','email') NOT NULL,
	`subject` varchar(256),
	`content` text NOT NULL,
	`variables` json,
	`image_url` varchar(1024),
	`is_active` boolean NOT NULL DEFAULT true,
	`category` varchar(128),
	`usage_count` int NOT NULL DEFAULT 0,
	`last_used_at` timestamp,
	`created_by` bigint unsigned NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `enhanced_message_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `message_campaigns` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`org_id` bigint unsigned NOT NULL,
	`template_id` bigint unsigned,
	`name` varchar(256) NOT NULL,
	`type` enum('bulk','workflow','manual') NOT NULL,
	`recipient_count` int NOT NULL DEFAULT 0,
	`success_count` int NOT NULL DEFAULT 0,
	`failure_count` int NOT NULL DEFAULT 0,
	`status` enum('draft','queued','sending','completed','failed','cancelled') NOT NULL,
	`scheduled_at` timestamp,
	`started_at` timestamp,
	`completed_at` timestamp,
	`created_by` bigint unsigned NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `message_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `message_deliveries` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`org_id` bigint unsigned NOT NULL,
	`client_id` bigint unsigned NOT NULL,
	`campaign_id` bigint unsigned,
	`template_id` bigint unsigned,
	`workflow_enrollment_id` bigint unsigned,
	`channel` enum('sms','email') NOT NULL,
	`provider` enum('aws_sns','aws_ses','mailchimp') NOT NULL,
	`recipient_email` varchar(256),
	`recipient_phone` varchar(50),
	`subject` varchar(256),
	`content` text NOT NULL,
	`status` enum('queued','sent','delivered','failed','bounced','complained','unsubscribed') NOT NULL,
	`external_id` varchar(256),
	`sent_at` timestamp,
	`delivered_at` timestamp,
	`opened_at` timestamp,
	`clicked_at` timestamp,
	`error_message` text,
	`retry_count` int NOT NULL DEFAULT 0,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `message_deliveries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `org_time_zones` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`org_id` bigint unsigned NOT NULL,
	`time_zone` varchar(128) NOT NULL DEFAULT 'America/Denver',
	`date_format` varchar(50) NOT NULL DEFAULT 'MM/dd/yyyy',
	`time_format` varchar(50) NOT NULL DEFAULT 'h:mm a',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `org_time_zones_id` PRIMARY KEY(`id`),
	CONSTRAINT `org_time_zones_org_id_unique` UNIQUE(`org_id`)
);
--> statement-breakpoint
CREATE TABLE `potential_duplicates` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`client_id` bigint unsigned NOT NULL,
	`suspected_duplicate_id` bigint unsigned NOT NULL,
	`match_type` enum('email','phone','name','combined') NOT NULL,
	`confidence` int NOT NULL,
	`matching_fields` json,
	`resolved_at` timestamp,
	`resolved_by` bigint unsigned,
	`resolution` enum('merged','not_duplicate','ignored'),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `potential_duplicates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saved_client_filters` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`org_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned,
	`name` varchar(256) NOT NULL,
	`description` text,
	`filter_criteria` json,
	`is_shared` boolean NOT NULL DEFAULT false,
	`usage_count` int NOT NULL DEFAULT 0,
	`last_used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saved_client_filters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `template_variables` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`org_id` bigint unsigned NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` text,
	`variable_key` varchar(256) NOT NULL,
	`default_value` text,
	`is_custom` boolean NOT NULL DEFAULT false,
	`is_system` boolean NOT NULL DEFAULT false,
	`data_type` enum('string','number','date','boolean') NOT NULL DEFAULT 'string',
	`created_by` bigint unsigned,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `template_variables_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_enrollments_history` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`enrollment_id` bigint unsigned NOT NULL,
	`workflow_id` bigint unsigned NOT NULL,
	`client_id` bigint unsigned NOT NULL,
	`action` enum('enrolled','cancelled','completed','paused','resumed','failed') NOT NULL,
	`reason` text,
	`triggered_by` varchar(256),
	`previous_status` varchar(50),
	`new_status` varchar(50),
	`metadata` json,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workflow_enrollments_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_triggers` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`workflow_id` bigint unsigned NOT NULL,
	`trigger_type` enum('appointment_completed','appointment_no_show','appointment_late','appointment_rescheduled','appointment_cancelled','client_created','tag_added','tag_removed','custom_date','manual') NOT NULL,
	`conditions` json,
	`is_active` boolean NOT NULL DEFAULT true,
	`priority` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workflow_triggers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `appointment_checkins` ADD CONSTRAINT `appointment_checkins_appointment_id_appointments_id_fk` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointment_checkins` ADD CONSTRAINT `appointment_checkins_checked_in_by_users_id_fk` FOREIGN KEY (`checked_in_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointment_sync_status` ADD CONSTRAINT `appointment_sync_status_appointment_id_appointments_id_fk` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calendar_connections` ADD CONSTRAINT `calendar_connections_org_id_orgs_id_fk` FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calendar_sync_log` ADD CONSTRAINT `calendar_sync_log_org_id_orgs_id_fk` FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `client_communication_preferences` ADD CONSTRAINT `client_communication_preferences_client_id_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `enhanced_message_templates` ADD CONSTRAINT `enhanced_message_templates_org_id_orgs_id_fk` FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `enhanced_message_templates` ADD CONSTRAINT `enhanced_message_templates_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_campaigns` ADD CONSTRAINT `message_campaigns_org_id_orgs_id_fk` FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_campaigns` ADD CONSTRAINT `message_campaigns_template_id_enhanced_message_templates_id_fk` FOREIGN KEY (`template_id`) REFERENCES `enhanced_message_templates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_campaigns` ADD CONSTRAINT `message_campaigns_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_deliveries` ADD CONSTRAINT `message_deliveries_org_id_orgs_id_fk` FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_deliveries` ADD CONSTRAINT `message_deliveries_client_id_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_deliveries` ADD CONSTRAINT `message_deliveries_campaign_id_message_campaigns_id_fk` FOREIGN KEY (`campaign_id`) REFERENCES `message_campaigns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_deliveries` ADD CONSTRAINT `message_deliveries_template_id_enhanced_message_templates_id_fk` FOREIGN KEY (`template_id`) REFERENCES `enhanced_message_templates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_deliveries` ADD CONSTRAINT `message_deliveries_workflow_enrollment_id_workflow_enrollments_id_fk` FOREIGN KEY (`workflow_enrollment_id`) REFERENCES `workflow_enrollments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `org_time_zones` ADD CONSTRAINT `org_time_zones_org_id_orgs_id_fk` FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `potential_duplicates` ADD CONSTRAINT `potential_duplicates_client_id_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `potential_duplicates` ADD CONSTRAINT `potential_duplicates_suspected_duplicate_id_clients_id_fk` FOREIGN KEY (`suspected_duplicate_id`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `potential_duplicates` ADD CONSTRAINT `potential_duplicates_resolved_by_users_id_fk` FOREIGN KEY (`resolved_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `saved_client_filters` ADD CONSTRAINT `saved_client_filters_org_id_orgs_id_fk` FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `saved_client_filters` ADD CONSTRAINT `saved_client_filters_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `template_variables` ADD CONSTRAINT `template_variables_org_id_orgs_id_fk` FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `template_variables` ADD CONSTRAINT `template_variables_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workflow_enrollments_history` ADD CONSTRAINT `workflow_enrollments_history_enrollment_id_workflow_enrollments_id_fk` FOREIGN KEY (`enrollment_id`) REFERENCES `workflow_enrollments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workflow_enrollments_history` ADD CONSTRAINT `workflow_enrollments_history_workflow_id_workflows_id_fk` FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workflow_enrollments_history` ADD CONSTRAINT `workflow_enrollments_history_client_id_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workflow_triggers` ADD CONSTRAINT `workflow_triggers_workflow_id_workflows_id_fk` FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`) ON DELETE no action ON UPDATE no action;