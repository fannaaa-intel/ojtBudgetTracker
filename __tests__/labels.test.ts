import { CATEGORY_SEED } from '../src/db/seed/categories';
import { CATEGORY_WORDS, categoryLabel, parseLabelMode, word, WORDS } from '../src/lib/labels';

describe('labels', () => {
  it('every word has a Taglish and an English version', () => {
    for (const w of Object.values(WORDS)) {
      expect(w.taglish.length).toBeGreaterThan(0);
      expect(w.english.length).toBeGreaterThan(0);
    }
  });
  it('words switch with the mode', () => {
    expect(word('pamasahe', 'taglish')).toBe('Pamasahe');
    expect(word('pamasahe', 'english')).toBe('Fare');
    expect(word('pagkain', 'english', { lower: true })).toBe('food');
  });
  it('mapped categories exist in the seed, and their Taglish label equals the seeded name', () => {
    const byKey = new Map(CATEGORY_SEED.map((c) => [c.key, c.name]));
    for (const [key, w] of Object.entries(CATEGORY_WORDS)) {
      expect(byKey.get(key)).toBe(WORDS[w].taglish);
    }
  });
  it('category labels', () => {
    expect(categoryLabel('commute', 'Pamasahe', 'english')).toBe('Fare');
    expect(categoryLabel('food_meals', 'Meals', 'english')).toBe('Meals');
    expect(categoryLabel(null, 'Other', 'english')).toBe('Other');
  });
  it('parses the saved mode (Taglish by default)', () => {
    expect(parseLabelMode('english')).toBe('english');
    expect(parseLabelMode(null)).toBe('taglish');
    expect(parseLabelMode('x')).toBe('taglish');
  });
});
