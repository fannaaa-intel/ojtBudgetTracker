/**
 * OJT hours and timeline. Pure: no React, no DB. Dates are 'YYYY-MM-DD' (Asia/Manila).
 *
 * Rules:
 *  - worked and WFH count hours; absent and holiday count 0
 *  - a workday nobody logged counts 0 hours until the intern marks it (they get a reminder)
 *  - holidays from the holidays table that fall on a workday are shown as "Holiday" automatically
 */
import { addDays, countWorkdays, isWorkday, parseISO, projectEndDate, weekday, type ISODate } from './dates';

export type OjtStatus = 'worked' | 'absent' | 'wfh' | 'holiday';
export type OjtLog = { date: ISODate; status: OjtStatus; hours: number; note?: string | null };

export const OJT_STATUS_LABEL: Record<OjtStatus, string> = { worked: 'Worked', wfh: 'WFH', absent: 'Absent', holiday: 'Holiday' };
export const MAX_HOURS_PER_LOG = 24;

/** "1,2,3,4,5" → [1,2,3,4,5] (0 = Sunday … 6 = Saturday). */
export function parseWorkdays(s: string): number[] {
  return s
    .split(',')
    .map((x) => Number(x.trim()))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
}

export function countsHours(status: OjtStatus): boolean {
  return status === 'worked' || status === 'wfh';
}

export function hoursDone(logs: readonly OjtLog[]): number {
  return logs.reduce((s, l) => s + (countsHours(l.status) ? l.hours : 0), 0);
}

export function daysWorked(logs: readonly OjtLog[]): number {
  return logs.filter((l) => countsHours(l.status) && l.hours > 0).length;
}

/** True if the date is one of the intern's weekdays (holiday or not). */
export function isScheduledDay(d: ISODate, workdays: readonly number[]): boolean {
  return workdays.includes(weekday(d));
}

export type TimelineEntry = {
  date: ISODate;
  /** workday = should log hours; holiday = workday that is a holiday; extra = logged on a day off */
  kind: 'workday' | 'holiday' | 'extra';
  holidayName?: string;
  log?: OjtLog;
};

/**
 * Every workday (and holiday on a workday) from start to today, newest first, plus any day off
 * the intern logged anyway (e.g. a Saturday duty). Future days are not listed.
 */
export function ojtTimeline(
  start: ISODate,
  today: ISODate,
  workdays: readonly number[],
  holidays: ReadonlyMap<ISODate, string>,
  logs: ReadonlyMap<ISODate, OjtLog>,
): TimelineEntry[] {
  const out: TimelineEntry[] = [];
  if (parseISO(start) > parseISO(today)) return out;
  for (let d = today; parseISO(d) >= parseISO(start); d = addDays(d, -1)) {
    const log = logs.get(d);
    if (isScheduledDay(d, workdays)) {
      const holidayName = holidays.get(d);
      out.push({ date: d, kind: holidayName ? 'holiday' : 'workday', holidayName, log });
    } else if (log) {
      out.push({ date: d, kind: 'extra', log });
    }
  }
  return out;
}

/** Workdays (not holidays) up to and including `today` that have no log yet. */
export function unloggedWorkdays(
  start: ISODate,
  today: ISODate,
  workdays: readonly number[],
  holidays: ReadonlyMap<ISODate, string>,
  logs: ReadonlyMap<ISODate, OjtLog>,
): ISODate[] {
  return ojtTimeline(start, today, workdays, holidays, logs)
    .filter((e) => e.kind === 'workday' && !e.log)
    .map((e) => e.date);
}

/** Hours must be > 0 and ≤ 24 for worked/WFH; absent and holiday are always 0. */
export function normalizeLogHours(status: OjtStatus, hoursText: string): { ok: true; hours: number } | { ok: false; error: string } {
  if (!countsHours(status)) return { ok: true, hours: 0 };
  const t = hoursText.trim().replace(',', '.');
  const h = /^\d+(\.\d+)?$/.test(t) ? Number(t) : NaN;
  if (!(h > 0 && h <= MAX_HOURS_PER_LOG)) return { ok: false, error: `Enter hours from 0.5 to ${MAX_HOURS_PER_LOG}` };
  return { ok: true, hours: h };
}

export type OjtProjectionInput = {
  /** All non-deleted expenses from the start date to today, centavos. */
  totalSpent: number;
  /** The part of totalSpent marked one-time (OJT requirements etc.). */
  oneTimeSpent: number;
  hoursDone: number;
  daysWorked: number;
  requiredHours: number | null;
  hoursPerDay: number;
  /** First day still to work: today if not yet logged, otherwise tomorrow. */
  fromDate: ISODate;
  workdays: readonly number[];
  holidays: ReadonlySet<ISODate>;
};

export type OjtProjection = {
  remainingHours: number | null;
  endDate: ISODate | null;
  workdaysLeft: number | null;
  /** Average cost per OJT day worked, one-time items excluded. null until a day is worked. */
  costPerDay: number | null;
  costPerHour: number | null;
  /** Spent so far + costPerDay × workdays left. null without required hours or history. */
  projectedTotal: number | null;
  pctDone: number | null;
};

/**
 * Projected end date and OJT cost. One-time items count in the total but not in the averages,
 * so a single big purchase does not inflate the forecast. Money stays integer centavos.
 */
export function ojtProjection(i: OjtProjectionInput): OjtProjection {
  const recurring = Math.max(0, i.totalSpent - i.oneTimeSpent);
  const costPerDay = i.daysWorked > 0 ? Math.round(recurring / i.daysWorked) : null;
  const costPerHour = i.hoursDone > 0 ? Math.round(recurring / i.hoursDone) : null;

  if (i.requiredHours == null || i.requiredHours <= 0) {
    return { remainingHours: null, endDate: null, workdaysLeft: null, costPerDay, costPerHour, projectedTotal: null, pctDone: null };
  }
  const remainingHours = Math.max(0, i.requiredHours - i.hoursDone);
  const pctDone = Math.min(100, Math.round((i.hoursDone / i.requiredHours) * 100));
  const endDate = remainingHours === 0 ? null : projectEndDate(i.fromDate, remainingHours, i.hoursPerDay, [...i.workdays], new Set(i.holidays));
  const workdaysLeft = remainingHours === 0 ? 0 : endDate ? countWorkdays(i.fromDate, endDate, [...i.workdays], new Set(i.holidays)) : null;
  const projectedTotal = costPerDay != null && workdaysLeft != null ? i.totalSpent + costPerDay * workdaysLeft : null;
  return { remainingHours, endDate, workdaysLeft, costPerDay, costPerHour, projectedTotal, pctDone };
}

/** What today looks like for the Home card. */
export function todayKind(today: ISODate, workdays: readonly number[], holidays: ReadonlyMap<ISODate, string>): 'workday' | 'holiday' | 'off' {
  if (!isScheduledDay(today, workdays)) return 'off';
  return isWorkday(today, [...workdays], new Set(holidays.keys())) ? 'workday' : 'holiday';
}
