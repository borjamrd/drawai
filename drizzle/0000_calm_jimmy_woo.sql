CREATE TABLE `assets` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`description` text NOT NULL,
	`svg_path` text NOT NULL,
	`default_width_pct` real DEFAULT 20 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `presentations` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`input` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `scene_plans` (
	`id` text NOT NULL,
	`presentation_id` text NOT NULL,
	`position` integer NOT NULL,
	`title` text NOT NULL,
	`excerpt` text NOT NULL,
	`key_concepts` text NOT NULL,
	`status` text NOT NULL,
	`visual_description` text,
	`scene` text,
	`missing_assets` text,
	`error_message` text,
	PRIMARY KEY(`id`, `presentation_id`),
	FOREIGN KEY (`presentation_id`) REFERENCES `presentations`(`id`) ON UPDATE no action ON DELETE cascade
);
