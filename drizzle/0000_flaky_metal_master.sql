CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`ciphertext` text NOT NULL,
	`iv` text NOT NULL,
	`expires_at` integer NOT NULL
);
