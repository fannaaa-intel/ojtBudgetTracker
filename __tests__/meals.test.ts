import { MEAL_PRESET_SEED } from '../src/db/seed/mealPresets';
import { presetCategoryKey, presetNeedsPrice } from '../src/lib/meals';

describe('meal presets', () => {
  it('logs snacks and coffee under Snacks & coffee, the rest under Meals', () => {
    expect(presetCategoryKey('snack')).toBe('food_snacks');
    expect(presetCategoryKey('coffee')).toBe('food_snacks');
    expect(presetCategoryKey('carinderia')).toBe('food_meals');
    expect(presetCategoryKey('baon')).toBe('food_meals');
  });
  it('asks for a price only for ₱0 presets that are not baon', () => {
    expect(presetNeedsPrice({ source: 'baon', price: 0 })).toBe(false);
    expect(presetNeedsPrice({ source: 'carinderia', price: 0 })).toBe(true);
    expect(presetNeedsPrice({ source: 'carinderia', price: 8000 })).toBe(false);
  });
  it('the Bicol carinderia seed needs a price; NCR presets do not', () => {
    const bicol = MEAL_PRESET_SEED.filter((p) => p.region === 'REGION_V');
    const ncr = MEAL_PRESET_SEED.filter((p) => p.region === 'NCR');
    expect(bicol.every(presetNeedsPrice)).toBe(true);
    expect(ncr.some(presetNeedsPrice)).toBe(false);
  });
});
