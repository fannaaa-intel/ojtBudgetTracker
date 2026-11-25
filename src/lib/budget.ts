/**
 * Budget envelopes. Pure: no React, no DB. Money = integer centavos. Weeks run Monday–Sunday.
 *
 * Rollover (when on): only leftover money carries into the next period, one period back:
 *   carry = max(0, last period's limit − last period's spending). Overspending never carries.
 *
 * Safe to spend today = (week budget + carry − spent before today) ÷ days left in the week (incl. today).
 * With no weekly budget, the monthly budget is used the same way over the days left in the month.
 * Spending before today is used (not today's), so the daily limit stays put while you spend today.
 *
 * Duty-day budgets (weekly, owner decision Nov 25, 2026): the limit (e.g. ₱1,000) covers only the
 * intern's duty days — their OJT workdays, holidays excluded. Weekends and days off "always vary":
 * that spending is tracked but not counted against the limit, and those days get no daily limit.
 * The daily limit on a duty day = (limit + carry − duty-day spending before today) ÷ duty days left.
 */
import { addDays, parseISO, startOfWeek, weekday, type ISODate } from './dates';
import { daysInMonth } from './paySchedule';

export type BudgetPeriod = 'weekly' | 'monthly';
/** Which days a budget counts: every day, or duty days only (weekly budgets). */
export type BudgetDays = 'all' | 'duty';
/** The intern's duty schedule: weekdays worked (0 = Sunday) and holidays (never duty days). */
export type DutySchedule = { workdays: readonly number[]; holidays: ReadonlySet<ISODate> };

/** Monthly budgets always count every day; only weekly ones can be duty-days-only. */
export function effectiveDays(period: BudgetPeriod, days: BudgetDays): BudgetDays {
  return period === 'weekly' && days === 'duty' ? 'duty' : 'all';
}

export function isDutyDay(d: ISODate, s: DutySchedule): boolean {
  return s.workdays.includes(weekday(d)) && !s.holidays.has(d);
}

/** True when a budget with these days counts spending on d. */
export function countsDay(days: BudgetDays, d: ISODate, s: DutySchedule): boolean {
  return days === 'all' || isDutyDay(d, s);
}

/** The days in [from, to] (inclusive) a budget counts. Empty when from > to. */
export function countedDays(days: BudgetDays, from: ISODate, to: ISODate, s: DutySchedule): ISODate[] {
  const out: ISODate[] = [];
  for (let d = from; parseISO(d) <= parseISO(to); d = addDays(d, 1)) if (countsDay(days, d, s)) out.push(d);
  return out;
}

/** (available − spent before today) ÷ counted days left (incl. today), floored to the centavo, never negative. */
export function dailyShare(available: number, spentBefore: number, daysLeft: number): number {
  if (daysLeft <= 0) return 0;
  return Math.max(0, Math.floor((available - spentBefore) / daysLeft));
}
export type BudgetStatus = 'ok' | 'near' | 'over';
export type DateRange = { from: ISODate; to: ISODate };

export const NEAR_LIMIT_PCT = 80;

export function periodRange(period: BudgetPeriod, today: ISODate): DateRange {
  if (period === 'weekly') {
    const from = startOfWeek(today);
    return { from, to: addDays(from, 6) };
  }
  const [y, m] = today.split('-').map(Number);
  const mm = String(m).padStart(2, '0');
  return { from: `${y}-${mm}-01`, to: `${y}-${mm}-${String(daysInMonth(y, m)).padStart(2, '0')}` };
}

export function previousPeriodRange(period: BudgetPeriod, today: ISODate): DateRange {
  const current = periodRange(period, today);
  return periodRange(period, addDays(current.from, -1));
}

/** ok < 80% ≤ near < 100% ≤ over. A ₱0 budget is "over" as soon as anything is spent. */
export function budgetStatus(spent: number, available: number): BudgetStatus {
  if (available <= 0) return spent > 0 ? 'over' : 'ok';
  if (spent >= available) return 'over';
  if (spent * 100 >= available * NEAR_LIMIT_PCT) return 'near';
  return 'ok';
}

export function rolloverCarry(rollover: boolean, lastLimit: number, lastSpent: number): number {
  return rollover ? Math.max(0, lastLimit - lastSpent) : 0;
}

/** Days left in the Monday–Sunday week, counting today: Monday → 7, Sunday → 1. */
export function daysLeftInWeek(today: ISODate): number {
  const wd = weekday(today); // 0 = Sunday
  return wd === 0 ? 1 : 8 - wd;
}

/** Days left in the period, counting today. Monthly: Nov 12 → 19 (12th…30th). */
export function daysLeftInPeriod(period: BudgetPeriod, today: ISODate): number {
  if (period === 'weekly') return daysLeftInWeek(today);
  const [y, m, d] = today.split('-').map(Number);
  return daysInMonth(y, m) - d + 1;
}

export type SafeToSpend = { dailyLimit: number; spentToday: number; left: number; daysLeft: number; period: BudgetPeriod };

/**
 * (budget available − spent before today) ÷ days left in the period, floored to the centavo.
 * Weekly budgets are used when present; otherwise monthly ones (the caller decides).
 */
export function safeToSpendToday(
  available: number,
  spentBeforeToday: number,
  spentToday: number,
  today: ISODate,
  period: BudgetPeriod = 'weekly',
): SafeToSpend {
  const daysLeft = daysLeftInPeriod(period, today);
  const dailyLimit = dailyShare(available, spentBeforeToday, daysLeft);
  return { dailyLimit, spentToday, left: dailyLimit - spentToday, daysLeft, period };
}

/** 0–100 for a progress bar (capped). */
export function progressPct(spent: number, available: number): number {
  if (available <= 0) return spent > 0 ? 100 : 0;
  return Math.min(100, Math.round((spent * 100) / available));
}
