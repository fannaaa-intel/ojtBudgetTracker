import { CATEGORY_SEED } from '../src/db/seed/categories';
import { ESSENTIAL_KINDS, essentialStatus, essentialStatusLabel, nextDue, validateEssential } from '../src/lib/essentials';

describe('essentials', () => {
  it('next due = last bought + lasts days', () => {
    expect(nextDue('2026-11-10', 7)).toBe('2026-11-17');
    expect(nextDue('2026-11-25', 30)).toBe('2026-12-25');
    expect(nextDue(null, 7)).toBeNull();
  });
  it('status: overdue, due soon (≤2 days), ok, never', () => {
    expect(essentialStatus('2026-11-12', '2026-11-11')).toBe('overdue');
    expect(essentialStatus('2026-11-12', '2026-11-12')).toBe('due_soon');
    expect(essentialStatus('2026-11-12', '2026-11-14')).toBe('due_soon');
    expect(essentialStatus('2026-11-12', '2026-11-15')).toBe('ok');
    expect(essentialStatus('2026-11-12', null)).toBe('never');
  });
  it('labels say "expires" for load and "runs out" otherwise', () => {
    expect(essentialStatusLabel('2026-11-12', '2026-11-13', 'load')).toBe('Expires tomorrow');
    expect(essentialStatusLabel('2026-11-12', '2026-11-10', 'load')).toBe('Expired 2 days ago');
    expect(essentialStatusLabel('2026-11-12', '2026-11-20', 'restock')).toBe('Runs out in 8 days');
    expect(essentialStatusLabel('2026-11-12', '2026-11-11', 'restock')).toBe('Ran out 1 day ago');
  });
  it('validates the form', () => {
    expect(validateEssential({ name: 'Shampoo', lastsText: '30', priceText: '120' })).toEqual({ ok: true, lastsDays: 30, price: 12000 });
    expect(validateEssential({ name: 'Data', lastsText: '7', priceText: '' })).toEqual({ ok: true, lastsDays: 7, price: null });
    const r = validateEssential({ name: '', lastsText: '0', priceText: 'x' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['lasts', 'name', 'price']);
  });
  it('every kind maps to a seeded Essentials category', () => {
    const keys = new Set(CATEGORY_SEED.map((c) => c.key));
    for (const k of ESSENTIAL_KINDS) expect(keys.has(k.categoryKey)).toBe(true);
  });
});
