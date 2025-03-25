ALTER TABLE `users` ADD `normalized_name` text;--> statement-breakpoint
UPDATE `users` SET `normalized_name` = LOWER(`name`);
CREATE UNIQUE INDEX `users_normalized_name_unique` ON `users` (`normalized_name`);

CREATE TABLE `users_temp` (
  `id` INTEGER PRIMARY KEY,
  `name` TEXT NOT NULL,
  `normalized_name` TEXT NOT NULL,
  `created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);

INSERT INTO `users_temp` (`id`, `name`, `normalized_name`, `created_at`, `updated_at`)
SELECT `id`, `name`, LOWER(`name`), `created_at`, `updated_at` FROM `users`;

DROP TABLE `users`;

ALTER TABLE `users_temp` RENAME TO `users`;

CREATE UNIQUE INDEX `users_name_unique` ON `users` (`name`);
CREATE UNIQUE INDEX `users_normalized_name_unique` ON `users` (`normalized_name`);
