import { count, eq } from 'drizzle-orm';
import type { DB } from '../client';
import { agencies, categories, fareRules, holidays, mealPresets } from '../schema';
import { AGENCY_SEED } from './agencies';
import { CATEGORY_SEED } from './categories';
import { FARE_RULE_SEED } from './fareRules';
import { HOLIDAY_SEED } from './holidays';
import { MEAL_PRESET_SEED } from './mealPresets';

/**
 * Inserts reference data once (first launch). Safe to call on every start.
 * expo-sqlite is a synchronous driver: use .run()/.get()/.all() inside transactions, never async callbacks.
 */
export function seedIfEmpty(db: DB): void {
  const row = db.select({ value: count() }).from(agencies).get();
  if (row && row.value > 0) return;

  db.transaction((tx) => {
    tx.insert(agencies).values(AGENCY_SEED).run();
    tx.insert(fareRules).values(FARE_RULE_SEED).run();
    tx.insert(holidays).values(HOLIDAY_SEED).run();
    tx.insert(mealPresets).values(MEAL_PRESET_SEED).run();

    // Parents first, then children (they need the parent id).
    let sort = 0;
    for (const c of CATEGORY_SEED.filter((c) => !c.parent)) {
      tx.insert(categories).values({ key: c.key, name: c.name, icon: c.icon, bucket: c.bucket, sort: sort++ }).run();
    }
    for (const c of CATEGORY_SEED.filter((c) => c.parent)) {
      const parent = tx.select({ id: categories.id }).from(categories).where(eq(categories.key, c.parent!)).get();
      if (!parent) throw new Error(`Seed: missing parent category ${c.parent}`);
      tx.insert(categories)
        .values({ key: c.key, name: c.name, icon: c.icon, bucket: c.bucket, parentId: parent.id, sort: sort++ })
        .run();
    }
  });
}
