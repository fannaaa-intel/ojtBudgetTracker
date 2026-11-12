import { priceNote, priceWentUp, tripNote, tripTotal, validateGroceryItem } from '../src/lib/grocery';

describe('grocery price memory', () => {
  it('notes price changes against last time', () => {
    expect(priceNote(6000, 6500)).toBe('₱5.00 more than last time (+8%)');
    expect(priceNote(6000, 5700)).toBe('₱3.00 less than last time (−5%)');
    expect(priceNote(6000, 6000)).toBe('Same as last time');
    expect(priceNote(null, 6000)).toBeNull();
  });
  it('flags a price increase', () => {
    expect(priceWentUp(6000, 6500)).toBe(true);
    expect(priceWentUp(6000, 6000)).toBe(false);
    expect(priceWentUp(6000, 5000)).toBe(false);
  });
  it('trip total counts only items in the cart with a price', () => {
    expect(tripTotal([{ inCart: true, cartPrice: 25000 }, { inCart: true, cartPrice: null }, { inCart: false, cartPrice: 9900 }])).toBe(25000);
  });
  it('trip note lists the first items', () => {
    expect(tripNote(['Rice', 'Eggs'])).toBe('Groceries: Rice, Eggs');
    expect(tripNote(['A', 'B', 'C', 'D', 'E', 'F'])).toBe('Groceries: A, B, C, D +2 more');
    expect(tripNote([])).toBe('Groceries');
  });
  it('validates items; staples need "lasts days"', () => {
    expect(validateGroceryItem({ name: 'Rice 5 kg', priceText: '275', isStaple: true, lastsText: '14' })).toEqual({ ok: true, price: 27500, lastsDays: 14 });
    expect(validateGroceryItem({ name: 'Eggs', priceText: '', isStaple: false, lastsText: '' })).toEqual({ ok: true, price: null, lastsDays: null });
    const r = validateGroceryItem({ name: '', priceText: 'x', isStaple: true, lastsText: '' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['lasts', 'name', 'price']);
  });
});
