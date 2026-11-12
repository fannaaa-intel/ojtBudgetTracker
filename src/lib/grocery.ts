/**
 * Grocery list with last-price memory. Pure: no React, no DB. Money = integer centavos.
 */
import { formatPeso, toCentavos } from './money';

/** "₱5.00 more than last time (+8%)", "₱3.00 less than last time (−5%)", "Same as last time", or null. */
export function priceNote(previous: number | null, current: number | null): string | null {
  if (previous == null || current == null || previous <= 0) return null;
  const diff = current - previous;
  if (diff === 0) return 'Same as last time';
  const pct = Math.round((Math.abs(diff) * 100) / previous);
  return diff > 0 ? `${formatPeso(diff)} more than last time (+${pct}%)` : `${formatPeso(-diff)} less than last time (−${pct}%)`;
}

/** True when the price went up by at least `minPct` percent (used for the "price up" chip). */
export function priceWentUp(previous: number | null, current: number | null, minPct = 1): boolean {
  if (previous == null || current == null || previous <= 0) return false;
  return (current - previous) * 100 >= previous * minPct;
}

export function tripTotal(items: readonly { inCart: boolean; cartPrice: number | null }[]): number {
  return items.reduce((s, i) => s + (i.inCart && i.cartPrice ? i.cartPrice : 0), 0);
}

/** "Rice 5 kg, Eggs, Oil" (first few names) for the trip expense note. */
export function tripNote(names: readonly string[], max = 4): string {
  if (names.length === 0) return 'Groceries';
  const head = names.slice(0, max).join(', ');
  return names.length > max ? `Groceries: ${head} +${names.length - max} more` : `Groceries: ${head}`;
}

export type GroceryDraft = { name: string; priceText: string; isStaple: boolean; lastsText: string };
export type GroceryErrors = Partial<Record<'name' | 'price' | 'lasts', string>>;

export function validateGroceryItem(d: GroceryDraft): { ok: true; price: number | null; lastsDays: number | null } | { ok: false; errors: GroceryErrors } {
  const errors: GroceryErrors = {};
  const price = d.priceText.trim() === '' ? null : toCentavos(d.priceText);
  const lasts = d.lastsText.trim() === '' ? null : /^\d{1,3}$/.test(d.lastsText.trim()) ? Number(d.lastsText.trim()) : NaN;
  if (!d.name.trim()) errors.name = 'Name it, e.g. Rice 5 kg';
  if (d.priceText.trim() !== '' && (price == null || price <= 0)) errors.price = 'Enter a price or leave blank';
  if (d.isStaple && !(lasts != null && lasts >= 1 && lasts <= 365)) errors.lasts = 'How many days it usually lasts (1–365)';
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, price, lastsDays: d.isStaple ? (lasts as number) : null };
}
