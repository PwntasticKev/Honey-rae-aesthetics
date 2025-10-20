CREATE TABLE `compliance_agreements` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`org_id` bigint unsigned NOT NULL,
	`agreement_type` enum('terms_of_service','privacy_policy','hipaa_agreement') NOT NULL,
	`version` varchar(50) NOT NULL,
	`ip_address` varchar(45) NOT NULL,
	`user_agent` text,
	`accepted_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compliance_agreements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `org_invitations` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`email` varchar(256) NOT NULL,
	`org_name` varchar(256) NOT NULL,
	`invited_by` bigint unsigned NOT NULL,
	`token` varchar(512) NOT NULL,
	`status` enum('pending','accepted','expired','cancelled') NOT NULL DEFAULT 'pending',
	`expires_at` timestamp NOT NULL,
	`accepted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `org_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `org_invitations_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `org_permissions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`org_id` bigint unsigned NOT NULL,
	`permission_id` bigint unsigned NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`disabled_by` bigint unsigned,
	`disabled_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `org_permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `password_resets` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`email` varchar(256) NOT NULL,
	`token` varchar(512) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `password_resets_id` PRIMARY KEY(`id`),
	CONSTRAINT `password_resets_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` varchar(512) NOT NULL,
	`category` varchar(128) NOT NULL,
	`is_default` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `permissions_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`org_id` bigint unsigned NOT NULL,
	`stripe_customer_id` varchar(256) NOT NULL,
	`stripe_subscription_id` varchar(256) NOT NULL,
	`stripe_price_id` varchar(256) NOT NULL,
	`status` enum('active','canceled','incomplete','incomplete_expired','past_due','trialing','unpaid','paused') NOT NULL,
	`current_period_start` timestamp NOT NULL,
	`current_period_end` timestamp NOT NULL,
	`cancel_at_period_end` boolean NOT NULL DEFAULT false,
	`canceled_at` timestamp,
	`trial_start` timestamp,
	`trial_end` timestamp,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_org_id_unique` UNIQUE(`org_id`),
	CONSTRAINT `subscriptions_stripe_subscription_id_unique` UNIQUE(`stripe_subscription_id`)
);
--> statement-breakpoint
CREATE TABLE `two_factor_auth` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`secret` varchar(512) NOT NULL,
	`backup_codes` json,
	`is_enabled` boolean NOT NULL DEFAULT false,
	`last_used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `two_factor_auth_id` PRIMARY KEY(`id`),
	CONSTRAINT `two_factor_auth_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `usage_tracking` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`org_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned,
	`metric` varchar(128) NOT NULL,
	`value` bigint NOT NULL,
	`metadata` json,
	`recorded_at` timestamp NOT NULL DEFAULT (now()),
	`date` varchar(10) NOT NULL,
	CONSTRAINT `usage_tracking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_invitations` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`org_id` bigint unsigned NOT NULL,
	`email` varchar(256) NOT NULL,
	`role` enum('admin','manager','staff') NOT NULL,
	`invited_by` bigint unsigned NOT NULL,
	`token` varchar(512) NOT NULL,
	`permissions` json,
	`status` enum('pending','accepted','expired','cancelled') NOT NULL DEFAULT 'pending',
	`expires_at` timestamp NOT NULL,
	`accepted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_invitations_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `user_permissions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`permission_id` bigint unsigned NOT NULL,
	`granted` boolean NOT NULL,
	`granted_by` bigint unsigned NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_sessions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`session_token` varchar(512) NOT NULL,
	`device_info` json,
	`device_name` varchar(256),
	`ip_address` varchar(45) NOT NULL,
	`user_agent` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`last_activity_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_sessions_session_token_unique` UNIQUE(`session_token`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `email_verified_at` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `password` varchar(512);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `phone_verified_at` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `is_master_owner` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `is_active` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `login_attempts` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `locked_until` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `last_login_at` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `last_login_ip` varchar(45);--> statement-breakpoint
ALTER TABLE `compliance_agreements` ADD CONSTRAINT `compliance_agreements_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `compliance_agreements` ADD CONSTRAINT `compliance_agreements_org_id_orgs_id_fk` FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `org_invitations` ADD CONSTRAINT `org_invitations_invited_by_users_id_fk` FOREIGN KEY (`invited_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `org_permissions` ADD CONSTRAINT `org_permissions_org_id_orgs_id_fk` FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `org_permissions` ADD CONSTRAINT `org_permissions_permission_id_permissions_id_fk` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `org_permissions` ADD CONSTRAINT `org_permissions_disabled_by_users_id_fk` FOREIGN KEY (`disabled_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_org_id_orgs_id_fk` FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `two_factor_auth` ADD CONSTRAINT `two_factor_auth_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `usage_tracking` ADD CONSTRAINT `usage_tracking_org_id_orgs_id_fk` FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `usage_tracking` ADD CONSTRAINT `usage_tracking_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_invitations` ADD CONSTRAINT `user_invitations_org_id_orgs_id_fk` FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_invitations` ADD CONSTRAINT `user_invitations_invited_by_users_id_fk` FOREIGN KEY (`invited_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_permissions` ADD CONSTRAINT `user_permissions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_permissions` ADD CONSTRAINT `user_permissions_permission_id_permissions_id_fk` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_permissions` ADD CONSTRAINT `user_permissions_granted_by_users_id_fk` FOREIGN KEY (`granted_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_sessions` ADD CONSTRAINT `user_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;