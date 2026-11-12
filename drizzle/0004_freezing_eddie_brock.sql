CREATE TABLE `bill_share_payments` (
	`bill_id` integer NOT NULL,
	`roommate_id` integer NOT NULL,
	`period` text NOT NULL,
	`paid_at` text NOT NULL,
	PRIMARY KEY(`bill_id`, `roommate_id`, `period`),
	FOREIGN KEY (`bill_id`) REFERENCES `recurring_bills`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`roommate_id`) REFERENCES `roommates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `recurring_bills` ADD `split_mode` text DEFAULT 'none' NOT NULL;