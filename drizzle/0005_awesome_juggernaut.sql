ALTER TABLE `restock_items` ADD `kind` text DEFAULT 'restock' NOT NULL;--> statement-breakpoint
ALTER TABLE `restock_items` ADD `category_id` integer REFERENCES categories(id);