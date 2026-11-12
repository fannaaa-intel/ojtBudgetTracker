/**
 * Local reminder planning. Pure: no React, no DB, no notification API.
 * The app re-plans every time it opens or data changes, scheduling the next few weeks of
 * one-off local notifications (offline; nothing is sent from a server).
 * Times are Asia/Manila (UTC+8, no daylight saving).
 */
import { addDays, type ISODate } from './dates';
import { formatPeso } from './money';

export type ReminderPrefs = {
  daily: boolean;
  dailyHour: number; // 24h, Manila
  ojt: boolean;
  bills: boolean;
  budgets: boolean;
  essentials: boolean;
  fares: boolean;
};

export const DEFAULT_PREFS: ReminderPrefs = { daily: true, dailyHour: 19, ojt: true, bills: true, budgets: true, essentials: true, fares: true };
export const OJT_REMINDER_HOUR = 18;
export const MORNING_HOUR = 8;
export const HORIZON_DAYS = 21;
/** Stay well under iOS's 64 pending notifications. */
export const MAX_SCHEDULED = 60;

export function parsePrefs(json: string | null): ReminderPrefs {
  if (!json) return DEFAULT_PREFS;
  try {
    const p = JSON.parse(json) as Partial<ReminderPrefs>;
    const hour = Number.isInteger(p.dailyHour) && p.dailyHour! >= 0 && p.dailyHour! <= 23 ? p.dailyHour! : DEFAULT_PREFS.dailyHour;
    const flag = (k: keyof ReminderPrefs) => (typeof p[k] === 'boolean' ? (p[k] as boolean) : (DEFAULT_PREFS[k] as boolean));
    return { daily: flag('daily'), dailyHour: hour, ojt: flag('ojt'), bills: flag('bills'), budgets: flag('budgets'), essentials: flag('essentials'), fares: flag('fares') };
  } catch {
    return DEFAULT_PREFS;
  }
}

/** Epoch ms for a Manila wall-clock time on a 'YYYY-MM-DD' day. */
export function manilaEpoch(date: ISODate, hour: number, minute = 0): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d, hour - 8, minute);
}

export function hourLabel(hour: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:00 ${hour < 12 ? 'AM' : 'PM'}`;
}

export type PlanInput = {
  today: ISODate;
  nowEpoch: number;
  prefs: ReminderPrefs;
  /** Anything logged today (expense/income)? Skips today's 7 PM reminder. */
  loggedToday: boolean;
  /** OJT workdays (no holidays, not before the start date) from today on. */
  ojtWorkdays: ISODate[];
  ojtLoggedToday: boolean;
  /** Earlier workdays with no OJT log. */
  unloggedPast: number;
  bills: { name: string; amount: number; dueDate: ISODate }[];
  essentials: { name: string; due: ISODate; kind: string }[];
  /** Day the 90-day fare check falls due (may be in the past). null = no reminder. */
  fareCheckOn: ISODate | null;
};

export type Planned = { key: string; epoch: number; title: string; body: string; url: string };

export function planReminders(i: PlanInput): Planned[] {
  const out: Planned[] = [];
  const end = addDays(i.today, HORIZON_DAYS);
  const p = i.prefs;

  if (p.daily) {
    for (let k = 0; k < HORIZON_DAYS; k++) {
      const d = addDays(i.today, k);
      if (k === 0 && i.loggedToday) continue;
      out.push({ key: `daily:${d}`, epoch: manilaEpoch(d, p.dailyHour), title: 'Log today’s spending', body: 'Pamasahe, pagkain, anything else? It takes a few seconds.', url: '/add' });
    }
  }

  if (p.ojt) {
    for (const d of i.ojtWorkdays) {
      if (d > end || (d === i.today && i.ojtLoggedToday)) continue;
      const extra = d === i.today && i.unloggedPast > 0 ? ` · ${i.unloggedPast} earlier ${i.unloggedPast === 1 ? 'day' : 'days'} not logged` : '';
      out.push({ key: `ojt:${d}`, epoch: manilaEpoch(d, OJT_REMINDER_HOUR), title: 'Log today’s OJT hours', body: `Tap to mark today as worked, WFH or absent${extra}.`, url: '/ojt' });
    }
  }

  if (p.bills) {
    for (const b of i.bills) {
      const d = addDays(b.dueDate, -1);
      if (d < i.today || d > end) continue;
      out.push({ key: `bill:${b.name}:${b.dueDate}`, epoch: manilaEpoch(d, MORNING_HOUR), title: `${b.name} due tomorrow`, body: b.amount > 0 ? `${formatPeso(b.amount)} — tap to mark it paid.` : 'Tap to mark it paid.', url: '/bills' });
    }
  }

  if (p.essentials) {
    for (const e of i.essentials) {
      if (e.due < i.today || e.due > end) continue;
      out.push({ key: `ess:${e.name}:${e.due}`, epoch: manilaEpoch(e.due, MORNING_HOUR + 1), title: e.kind === 'load' ? `${e.name} expires today` : `${e.name} may run out today`, body: 'Tap “Bought” after you restock to restart the countdown.', url: '/essentials' });
    }
  }

  if (p.fares && i.fareCheckOn) {
    const d = i.fareCheckOn < addDays(i.today, 1) ? addDays(i.today, 1) : i.fareCheckOn;
    if (d <= end) out.push({ key: `fares:${d}`, epoch: manilaEpoch(d, MORNING_HOUR + 1), title: 'Time to check your fares', body: 'It has been 90 days. Compare with the posted fare matrix.', url: '/fares' });
  }

  return out
    .filter((n) => n.epoch > i.nowEpoch)
    .sort((a, b) => a.epoch - b.epoch)
    .slice(0, MAX_SCHEDULED);
}

export type BudgetLevel = 'near' | 'over';

/**
 * Budget alerts to send now: one per budget per period per level (near at 80%, over at 100%).
 * `sent` maps "<budgetId>:<periodStart>" → the highest level already sent.
 */
export function budgetAlertsToSend(
  current: { budgetId: number; name: string; periodFrom: ISODate; status: 'ok' | 'near' | 'over' }[],
  sent: Record<string, BudgetLevel>,
): { key: string; level: BudgetLevel; name: string }[] {
  const out: { key: string; level: BudgetLevel; name: string }[] = [];
  for (const b of current) {
    if (b.status === 'ok') continue;
    const key = `${b.budgetId}:${b.periodFrom}`;
    const prev = sent[key];
    if (prev === 'over' || prev === b.status) continue;
    out.push({ key, level: b.status, name: b.name });
  }
  return out;
}
