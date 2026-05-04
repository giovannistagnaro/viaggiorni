ALTER TABLE `entry_sections` RENAME TO `entry_writings`;--> statement-breakpoint
ALTER TABLE `template_sections` RENAME TO `template_writings`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_entry_writings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entry_id` integer NOT NULL,
	`type` text NOT NULL,
	`label` text,
	`content` text,
	`position` integer NOT NULL,
	`is_visible` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_entry_writings`("id", "entry_id", "type", "label", "content", "position", "is_visible", "created_at", "updated_at") SELECT "id", "entry_id", "type", "label", "content", "position", "is_visible", "created_at", "updated_at" FROM `entry_writings`;--> statement-breakpoint
DROP TABLE `entry_writings`;--> statement-breakpoint
ALTER TABLE `__new_entry_writings` RENAME TO `entry_writings`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_template_writings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`template_id` integer NOT NULL,
	`type` text NOT NULL,
	`label` text,
	`position` integer NOT NULL,
	`is_visible` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`template_id`) REFERENCES `template`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_template_writings`("id", "template_id", "type", "label", "position", "is_visible", "created_at") SELECT "id", "template_id", "type", "label", "position", "is_visible", "created_at" FROM `template_writings`;--> statement-breakpoint
DROP TABLE `template_writings`;--> statement-breakpoint
ALTER TABLE `__new_template_writings` RENAME TO `template_writings`;