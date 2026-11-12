/**
 * Essentials: things that run out or expire on a cycle (toiletries, laundry, load/data promos,
 * vitamins, haircuts). Pure: no React, no DB. Money = integer centavos.
 */
import { addDays, type ISODate } from './dates';
import { daysBetween } from './paySchedule';
import { toCentavos } from './money';

export type EssentialKind = 'restock' | 'laundry' | 'load' | 'health' | 'grooming';
export type EssentialStatus = 'overdue' | 'due_soon' | 'ok' | 'never';

export const ESSENTIAL_KINDS: { kind: EssentialKind; label: string; categoryKey: string; example: string; days: number }[] = [
  { kind: 'restock', label: 'Toiletries', categoryKey: 'ess_toiletries', example: 'Shampoo, soap, toothpaste', days: 30 },
  { kind: 'laundry', label: 'Laundry', categoryKey: 'ess_laundry', example: 'Laundry shop, detergent', days: 7 },
  { kind: 'load', label: 'Load / data', categoryKey: 'ess_load', example: 'Data promo, load', days: 7 },
  { kind: 'health', label: 'Health', categoryKey: 'ess_health', example: 'Vitamins, maintenance meds', days: 30 },
  { kind: 'grooming', label: 'Grooming', categoryKey: 'ess_grooming', example: 'Haircut', days: 30 },
];

export const DUE_SOON_DAYS = 2;

/** Next time it runs out / expires: last bought + lasts N days. null if never bought. */
export function nextDue(lastBought: ISODate | null, lastsDays: number): ISODate | null {
  return lastBought ? addDays(lastBought, Math.max(1, lastsDays)) : null;
}

export function essentialStatus(today: ISODate, due: ISODate | null): EssentialStatus {
  if (!due) return 'never';
  const d = daysBetween(today, due);
  if (d < 0) return 'overdue';
  if (d <= DUE_SOON_DAYS) return 'due_soon';
  return 'ok';
}

export function essentialStatusLabel(today: ISODate, due: ISODate | null, kind: EssentialKind): string {
  if (!due) return 'Not bought yet';
  const d = daysBetween(today, due);
  const verb = kind === 'load' ? 'Expires' : 'Runs out';
  if (d < 0) return kind === 'load' ? `Expired ${-d} ${-d === 1 ? 'day' : 'days'} ago` : `Ran out ${-d} ${-d === 1 ? 'day' : 'days'} ago`;
  if (d === 0) return `${verb} today`;
  if (d === 1) return `${verb} tomorrow`;
  return `${verb} in ${d} days`;
}

export type EssentialDraft = { name: string; lastsText: string; priceText: string };
export type EssentialErrors = Partial<Record<'name' | 'lasts' | 'price', string>>;

export function validateEssential(d: EssentialDraft): { ok: true; lastsDays: number; price: number | null } | { ok: false; errors: EssentialErrors } {
  const errors: EssentialErrors = {};
  const lasts = /^\d{1,3}$/.test(d.lastsText.trim()) ? Number(d.lastsText.trim()) : NaN;
  const price = d.priceText.trim() === '' ? null : toCentavos(d.priceText);
  if (!d.name.trim()) errors.name = 'Name it, e.g. Shampoo';
  if (!(lasts >= 1 && lasts <= 365)) errors.lasts = 'Days from 1 to 365';
  if (d.priceText.trim() !== '' && (price == null || price <= 0)) errors.price = 'Enter a price or leave blank';
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, lastsDays: lasts, price };
}
