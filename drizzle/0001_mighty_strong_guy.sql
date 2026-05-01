PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`theme` text DEFAULT 'light' NOT NULL,
	`password_hash` text NOT NULL,
	`streak_tolerance` integer DEFAULT 0 NOT NULL,
	`ollama_model` text,
	`created_at` text NOT NULL,
	`updated_at` text
);
--> statement-breakpoint
INSERT INTO `__new_settings`("id", "name", "theme", "password_hash", "streak_tolerance", "ollama_model", "created_at", "updated_at") SELECT "id", "name", "theme", "password_hash", "streak_tolerance", "ollama_model", "created_at", "updated_at" FROM `settings`;--> statement-breakpoint
DROP TABLE `settings`;--> statement-breakpoint
ALTER TABLE `__new_settings` RENAME TO `settings`;--> statement-breakpoint
PRAGMA foreign_keys=ON;