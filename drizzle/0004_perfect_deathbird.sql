ALTER TABLE `registration_tokens` RENAME TO `login_tokens`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_login_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_login_tokens`("id", "user_id", "token", "expires_at", "created_at") SELECT "id", "user_id", "token", "expires_at", "created_at" FROM `login_tokens`;--> statement-breakpoint
DROP TABLE `login_tokens`;--> statement-breakpoint
ALTER TABLE `__new_login_tokens` RENAME TO `login_tokens`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `login_tokens_token_unique` ON `login_tokens` (`token`);