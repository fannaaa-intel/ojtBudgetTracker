ALTER TABLE `grocery_items` ADD `prev_price` integer;--> statement-breakpoint
ALTER TABLE `grocery_items` ADD `on_list` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `grocery_items` ADD `in_cart` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `grocery_items` ADD `cart_price` integer;--> statement-breakpoint
ALTER TABLE `grocery_items` ADD `is_staple` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `grocery_items` ADD `lasts_days` integer;--> statement-breakpoint
ALTER TABLE `grocery_items` ADD `last_bought` text;