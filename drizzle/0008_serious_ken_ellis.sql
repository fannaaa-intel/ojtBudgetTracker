ALTER TABLE `ambagan` ADD `kind` text DEFAULT 'gala' NOT NULL;--> statement-breakpoint
ALTER TABLE `ambagan` ADD `paid_by` text DEFAULT 'me' NOT NULL;--> statement-breakpoint
ALTER TABLE `ambagan` ADD `transaction_id` integer REFERENCES transactions(id);--> statement-breakpoint
ALTER TABLE `debts` ADD `ambagan_id` integer;