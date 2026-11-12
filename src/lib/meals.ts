/** Meal preset rules. Pure: no React, no DB. */

export type MealSource = 'baon' | 'carinderia' | 'fast_food' | 'food_court' | 'delivery' | 'snack' | 'coffee';

/** Category a preset logs into: snacks/coffee → Snacks & coffee, everything else → Meals. */
export function presetCategoryKey(source: MealSource): 'food_snacks' | 'food_meals' {
  return source === 'snack' || source === 'coffee' ? 'food_snacks' : 'food_meals';
}

/** A ₱0 preset that is not baon has no price yet (e.g. Bicol carinderia) — ask before logging. */
export function presetNeedsPrice(p: { source: MealSource; price: number }): boolean {
  return p.price <= 0 && p.source !== 'baon';
}
