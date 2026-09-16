CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'active',
	`priority` text DEFAULT 'none',
	`project_id` text,
	`parent_task_id` text,
	`due_date` text,
	`due_time` text,
	`reminder_enabled` integer DEFAULT 0,
	`reminder_time` text,
	`recurrence_rule` text,
	`completed_at` text,
	`created_at` text,
	`updated_at` text,
	`archived_at` text,
	`sort_order` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`color` text DEFAULT '#3b82f6',
	`icon` text,
	`sort_order` integer DEFAULT 0,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#3b82f6',
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `task_tags` (
	`task_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`task_id`, `tag_id`)
);
--> statement-breakpoint
CREATE TABLE `reminders` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text,
	`scheduled_at` text NOT NULL,
	`notification_title` text NOT NULL,
	`notification_body` text,
	`enabled` integer DEFAULT 1,
	`fired_at` text,
	`snoozed_until` text,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`value` text
);
--> statement-breakpoint
CREATE INDEX `tasks_due_date_idx` ON `tasks` (`due_date`);
--> statement-breakpoint
CREATE INDEX `tasks_status_idx` ON `tasks` (`status`);
--> statement-breakpoint
CREATE INDEX `tasks_project_id_idx` ON `tasks` (`project_id`);
--> statement-breakpoint
CREATE INDEX `tasks_parent_task_id_idx` ON `tasks` (`parent_task_id`);
--> statement-breakpoint
CREATE INDEX `tasks_completed_at_idx` ON `tasks` (`completed_at`);
--> statement-breakpoint
CREATE INDEX `tasks_sort_order_idx` ON `tasks` (`sort_order`);
--> statement-breakpoint
CREATE INDEX `task_tags_task_id_idx` ON `task_tags` (`task_id`);
--> statement-breakpoint
CREATE INDEX `task_tags_tag_id_idx` ON `task_tags` (`tag_id`);
--> statement-breakpoint
CREATE INDEX `reminders_scheduled_at_idx` ON `reminders` (`scheduled_at`);
--> statement-breakpoint
CREATE INDEX `reminders_enabled_idx` ON `reminders` (`enabled`);
--> statement-breakpoint
CREATE INDEX `settings_key_idx` ON `settings` (`key`);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_key_unique` ON `settings` (`key`);

