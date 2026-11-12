/**
 * Allowance / pay schedule math on 'YYYY-MM-DD' strings. Pure: no React, no DB.
 *   weekly       → every 7 days from the anchor date
 *   semi_monthly → every 15th and 30th (the 30th becomes the last day in February)
 *   monthly      → the anchor's day of month, clamped to short months
 *   once         → the anchor date only
 */
import { addDays, isValidISO, parseISO, type ISODate } from './dates';
import { toCentavos } from './money';

export type PayFrequency = 'weekly' | 'semi_monthly' | 'monthly' | 'once';

export const PAY_FREQUENCY_LABEL: Record<PayFrequency, string> = {
  weekly: 'Weekly',
  semi_monthly: '15th & 30th',
  monthly: 'Monthly',
  once: 'One time',
};

const DAY_MS = 86_400_000;

export function daysInMonth(year: number, month1: number): number {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate();
}

function ymd(y: number, m: number, d: number): ISODate {
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function nextMonth(y: number, m: number): [number, number] {
  return m === 12 ? [y + 1, 1] : [y, m + 1];
}

/** Whole days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: ISODate, to: ISODate): number {
  return Math.round((parseISO(to) - parseISO(from)) / DAY_MS);
}

/**
 * The first payday on or after `today`. `anchor` is the first/known payday
 * (required for weekly, monthly and once; optional for 15th & 30th).
 * Returns null when there is no upcoming payday (a past one-time payment, or no anchor).
 */
export function nextPayDate(freq: PayFrequency, anchor: ISODate | null, today: ISODate): ISODate | null {
  const start = anchor && anchor > today ? anchor : today;

  if (freq === 'once') return anchor && anchor >= today ? anchor : null;

  if (freq === 'weekly') {
    if (!anchor) return null;
    if (anchor >= today) return anchor;
    const weeks = Math.ceil(daysBetween(anchor, today) / 7);
    return addDays(anchor, weeks * 7);
  }

  let [y, m] = start.split('-').map(Number);

  if (freq === 'semi_monthly') {
    for (let i = 0; i < 3; i++) {
      for (const day of [15, Math.min(30, daysInMonth(y, m))]) {
        const d = ymd(y, m, day);
        if (d >= start) return d;
      }
      [y, m] = nextMonth(y, m);
    }
    return null;
  }

  // monthly
  if (!anchor) return null;
  const wanted = Number(anchor.split('-')[2]);
  for (let i = 0; i < 3; i++) {
    const d = ymd(y, m, Math.min(wanted, daysInMonth(y, m)));
    if (d >= start) return d;
    [y, m] = nextMonth(y, m);
  }
  return null;
}

export type IncomeSourceDraft = { name: string; amountText: string; frequency: PayFrequency; anchor: ISODate | null };
export type IncomeSourceErrors = Partial<Record<'name' | 'amount' | 'anchor', string>>;

/** Income source form rules. 15th & 30th needs no date; the others need the next/first payday. */
export function validateIncomeSource(d: IncomeSourceDraft): { ok: true; amount: number } | { ok: false; errors: IncomeSourceErrors } {
  const errors: IncomeSourceErrors = {};
  const amount = toCentavos(d.amountText);
  if (!d.name.trim()) errors.name = 'Give it a name, e.g. Baon from Mama';
  if (amount == null || amount <= 0) errors.amount = 'Enter the usual amount';
  if (d.frequency !== 'semi_monthly' && !(d.anchor && isValidISO(d.anchor))) errors.anchor = 'Choose the payday';
  return Object.keys(errors).length || amount == null ? { ok: false, errors } : { ok: true, amount };
}

/** "today" / "tomorrow" / "in 5 days". */
export function daysUntilLabel(days: number): string {
  if (days <= 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
}
