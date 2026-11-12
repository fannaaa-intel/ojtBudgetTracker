import { asc, eq, isNull, or } from 'drizzle-orm';
import { db } from '@/db/client';
import { mealPresets, type Region } from '@/db/schema';
import { useDbQuery } from '@/db/useDbQuery';
import { todayManila } from '@/lib/dates';
import { presetCategoryKey } from '@/lib/meals';
import { addTransaction, categoryFamilyIds, getCategoryIdByKey, getDefaultWalletId, sumAmount } from '../transactions/queries';

export type MealPreset = typeof mealPresets.$inferSelect;

/** Presets for the user's region plus region-less ones (baon). Prices come from the DB, never the screen. */
export function listMealPresets(region: Region): MealPreset[] {
  return db
    .select()
    .from(mealPresets)
    .where(or(eq(mealPresets.region, region), isNull(mealPresets.region)))
    .orderBy(asc(mealPresets.sort), asc(mealPresets.id))
    .all();
}

export function useMealPresets(region: Region | undefined) {
  return useDbQuery(() => (region ? listMealPresets(region) : []), ['meal_presets'], [region]);
}

/** Today's Pagkain spending (parent + all food children), live. */
export function useFoodSpentToday(): number {
  return useDbQuery(() => {
    const foodId = getCategoryIdByKey('food');
    const today = todayManila();
    return foodId == null ? 0 : sumAmount('expense', today, today, categoryFamilyIds(foodId));
  }, ['transactions']);
}

export function updateMealPresetPrice(id: number, price: number): void {
  db.update(mealPresets).set({ price }).where(eq(mealPresets.id, id)).run();
}

/** One-tap log of a preset as today's Pagkain expense. Returns the new transaction id. */
export function logMealPreset(userId: number, preset: MealPreset, amount: number = preset.price): number {
  const categoryId = getCategoryIdByKey(presetCategoryKey(preset.source));
  if (categoryId == null) throw new Error('Food categories are missing from the database');
  return addTransaction(userId, {
    kind: 'expense',
    amount,
    date: todayManila(),
    categoryId,
    walletId: getDefaultWalletId(),
    tags: preset.source === 'baon' ? ['baon'] : [],
    note: preset.label,
  });
}
