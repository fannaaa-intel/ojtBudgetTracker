/**
 * Meal presets (centavos). NCR values from 2026 price reports; Bicol left for the user to set.
 * Carinderia ₱50–₱70 and rising → default ₱80; fast food ≈ ₱150; food court ₱250–₱350.
 */
export const MEAL_PRESET_SEED: {
  source: 'baon' | 'carinderia' | 'fast_food' | 'food_court' | 'delivery' | 'snack' | 'coffee';
  label: string;
  price: number;
  region: 'NCR' | 'REGION_V' | null;
  sort: number;
}[] = [
  { source: 'baon', label: 'Baon (packed)', price: 0, region: null, sort: 0 },
  { source: 'carinderia', label: 'Carinderia lunch', price: 8000, region: 'NCR', sort: 1 },
  { source: 'fast_food', label: 'Fast food meal', price: 15000, region: 'NCR', sort: 2 },
  { source: 'food_court', label: 'Food court', price: 30000, region: 'NCR', sort: 3 },
  { source: 'snack', label: 'Merienda / street food', price: 4000, region: 'NCR', sort: 4 },
  { source: 'carinderia', label: 'Carinderia lunch', price: 0, region: 'REGION_V', sort: 1 }, // user sets local price
];
