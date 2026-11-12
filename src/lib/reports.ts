/**
 * Report maths. Pure: no React, no DB. Money = integer centavos.
 * Charts are simple bars; this file turns amounts into ranges, series and bar sizes.
 */
import { addDays, parseISO, startOfWeek, type ISODate } from './dates';
import { daysBetween } from './paySchedule';

export type ReportPeriod = 'week' | 'month' | 'ojt';
export const REPORT_PERIOD_LABEL: Record<ReportPeriod, string> = { week: 'This week', month: 'This month', ojt: 'Whole OJT' };

/** Period start → today (the report never includes the future). */
export function reportRange(period: ReportPeriod, today: ISODate, ojtStart: ISODate): { from: ISODate; to: ISODate } {
  let from = today;
  if (period === 'week') from = startOfWeek(today);
  if (period === 'month') from = `${today.slice(0, 7)}-01`;
  if (period === 'ojt') from = ojtStart <= today ? ojtStart : today;
  return { from, to: today };
}

export function dayCount(from: ISODate, to: ISODate): number {
  return Math.max(1, daysBetween(from, to) + 1);
}

export function averagePerDay(total: number, days: number): number {
  return days > 0 ? Math.round(total / days) : 0;
}

export type Point = { key: ISODate; label: string; amount: number };

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Daily totals with zeros filled in. Over 31 days the series is grouped by week (Monday start)
 * so bars stay readable.
 */
export function spendingSeries(daily: ReadonlyMap<ISODate, number>, from: ISODate, to: ISODate): Point[] {
  const out: Point[] = [];
  if (dayCount(from, to) <= 31) {
    for (let d = from; parseISO(d) <= parseISO(to); d = addDays(d, 1)) {
      const wd = new Date(parseISO(d)).getUTCDay();
      out.push({ key: d, label: dayCount(from, to) <= 7 ? DOW[wd] : String(Number(d.slice(8))), amount: daily.get(d) ?? 0 });
    }
    return out;
  }
  for (let w = startOfWeek(from); parseISO(w) <= parseISO(to); w = addDays(w, 7)) {
    let sum = 0;
    for (let i = 0; i < 7; i++) {
      const d = addDays(w, i);
      if (d >= from && d <= to) sum += daily.get(d) ?? 0;
    }
    out.push({ key: w, label: `${MON[Number(w.slice(5, 7)) - 1]} ${Number(w.slice(8))}`, amount: sum });
  }
  return out;
}

/** Bar sizes 0–1 relative to the largest value; any non-zero value gets at least a sliver. */
export function barFractions(values: readonly number[], minFraction = 0.02): number[] {
  const max = Math.max(0, ...values);
  if (max === 0) return values.map(() => 0);
  return values.map((v) => (v <= 0 ? 0 : Math.max(minFraction, v / max)));
}

/** Index of the largest value (the one bar drawn in the strong colour), or -1 when all are 0. */
export function highlightIndex(values: readonly number[]): number {
  let best = -1;
  values.forEach((v, i) => {
    if (v > 0 && (best === -1 || v > values[best])) best = i;
  });
  return best;
}

/** Category totals → sorted with whole-number percentages of the total. */
export function withShares<T extends { amount: number }>(items: readonly T[]): (T & { pct: number })[] {
  const total = items.reduce((s, x) => s + x.amount, 0);
  return [...items]
    .filter((x) => x.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .map((x) => ({ ...x, pct: total > 0 ? Math.round((x.amount * 100) / total) : 0 }));
}
