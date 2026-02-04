CREATE TABLE `workflow_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`workflow_id` text NOT NULL,
	`node_id` text NOT NULL,
	`type` text NOT NULL,
	`file_name` text NOT NULL,
	`file_path` text NOT NULL,
	`mime_type` text,
	`file_size` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `workflow_edges` (
	`id` text PRIMARY KEY NOT NULL,
	`workflow_id` text NOT NULL,
	`source` text NOT NULL,
	`target` text NOT NULL,
	`source_handle` text,
	`target_handle` text,
	`animated` integer DEFAULT true,
	`style` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `workflow_nodes` (
	`id` text PRIMARY KEY NOT NULL,
	`workflow_id` text NOT NULL,
	`type` text NOT NULL,
	`position` text NOT NULL,
	`data` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `workflows` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`viewport` text DEFAULT '{"x":0,"y":0,"zoom":1}'
);
