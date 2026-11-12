/**
 * Recurring bills. Pure: no React, no DB. Money = integer centavos. Periods are 'YYYY-MM'.
 */
import { toCentavos } from './money';
import { daysBetween, daysInMonth } from './paySchedule';
import type { ISODate } from './dates';

export type BillStatus = 'paid' | 'overdue' | 'due_soon' | 'upcoming';
export const DUE_SOON_DAYS = 3;

export function billPeriod(today: ISODate): string {
  return today.slice(0, 7);
}

/** Due date in a 'YYYY-MM' period; a due day of 31 becomes the 30th / 28th in short months. */
export function dueDateFor(period: string, dueDay: number): ISODate {
  const [y, m] = period.split('-').map(Number);
  const d = Math.min(Math.max(1, dueDay), daysInMonth(y, m));
  return `${period}-${String(d).padStart(2, '0')}`;
}

export function billStatus(today: ISODate, dueDate: ISODate, paid: boolean): BillStatus {
  if (paid) return 'paid';
  const days = daysBetween(today, dueDate);
  if (days < 0) return 'overdue';
  if (days <= DUE_SOON_DAYS) return 'due_soon';
  return 'upcoming';
}

export function billStatusLabel(status: BillStatus, today: ISODate, dueDate: ISODate): string {
  const days = daysBetween(today, dueDate);
  if (status === 'paid') return 'Paid';
  if (status === 'overdue') return days === -1 ? 'Overdue 1 day' : `Overdue ${-days} days`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}

/** kWh × rate (centavos per kWh), rounded to the centavo. 123.4 kWh × ₱15.06 = ₱1,858.40. */
export function kwhCost(kwh: number, rateCentavosPerKwh: number): number {
  return Math.round(kwh * rateCentavosPerKwh);
}

export function parseKwh(text: string): number | null {
  const t = text.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  const n = Number(t);
  return n > 0 && n < 100_000 ? n : null;
}

export type BillDraft = { name: string; amountText: string; dueDayText: string; isVariable: boolean };
export type BillErrors = Partial<Record<'name' | 'amount' | 'dueDay', string>>;

/** A variable bill (electricity) may have a ₱0 "usual" amount; fixed bills need one. */
export function validateBill(d: BillDraft): { ok: true; amount: number; dueDay: number } | { ok: false; errors: BillErrors } {
  const errors: BillErrors = {};
  const amount = d.amountText.trim() === '' && d.isVariable ? 0 : toCentavos(d.amountText);
  const dueDay = /^\d{1,2}$/.test(d.dueDayText.trim()) ? Number(d.dueDayText.trim()) : NaN;
  if (!d.name.trim()) errors.name = 'Give the bill a name';
  if (amount == null || amount < 0 || (!d.isVariable && amount === 0)) errors.amount = d.isVariable ? 'Enter a usual amount or leave blank' : 'Enter the monthly amount';
  if (!(dueDay >= 1 && dueDay <= 31)) errors.dueDay = 'A day from 1 to 31';
  return Object.keys(errors).length || amount == null ? { ok: false, errors } : { ok: true, amount, dueDay };
}

/** Rate text "15.06" → 1506 centavos per kWh (two decimals). */
export function parseRate(text: string): number | null {
  const c = toCentavos(text);
  return c != null && c > 0 && c < 100_00 ? c : null;
}
