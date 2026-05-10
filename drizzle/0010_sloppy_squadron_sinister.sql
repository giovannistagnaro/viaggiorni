PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_entry_widgets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entry_id` integer NOT NULL,
	`type` text NOT NULL,
	`position` integer NOT NULL,
	`col_span` integer DEFAULT 4 NOT NULL,
	`is_visible` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_entry_widgets`("id", "entry_id", "type", "position", "col_span", "is_visible", "created_at") SELECT "id", "entry_id", "type", "position", "col_span", "is_visible", "created_at" FROM `entry_widgets`;--> statement-breakpoint
DROP TABLE `entry_widgets`;--> statement-breakpoint
ALTER TABLE `__new_entry_widgets` RENAME TO `entry_widgets`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_template_widgets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`template_id` integer NOT NULL,
	`type` text NOT NULL,
	`position` integer NOT NULL,
	`col_span` integer DEFAULT 4 NOT NULL,
	`is_visible` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`template_id`) REFERENCES `template`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_template_widgets`("id", "template_id", "type", "position", "col_span", "is_visible", "created_at") SELECT "id", "template_id", "type", "position", "col_span", "is_visible", "created_at" FROM `template_widgets`;--> statement-breakpoint
DROP TABLE `template_widgets`;--> statement-breakpoint
ALTER TABLE `__new_template_widgets` RENAME TO `template_widgets`;