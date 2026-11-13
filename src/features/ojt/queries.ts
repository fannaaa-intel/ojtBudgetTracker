import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { holidays, ojtDays } from '@/db/schema';
import { useDbQuery } from '@/db/useDbQuery';
import { addDays, todayManila, type ISODate } from '@/lib/dates';
import { holidaysFor } from '@/lib/seedTopUp';
import { daysWorked, hoursDone, ojtProjection, ojtTimeline, parseWorkdays, unloggedWorkdays, type OjtLog, type OjtStatus } from '@/lib/ojt';
import { getProfile } from '../profile/queries';
import { sumAmount, sumOneTime } from '../transactions/queries';

export const OJT_TABLES = ['ojt_days', 'holidays', 'ojt_profile', 'users', 'transactions'] as const;

/** National holidays plus the user's region's local ones (e.g. LGU Talisay for Bicol). */
export function getHolidayMap(region?: string | null): Map<ISODate, string> {
  const rows = db.select().from(holidays).orderBy(asc(holidays.date)).all();
  return new Map(holidaysFor(rows, region ?? getProfile()?.user.region).map((h) => [h.date, h.name]));
}

export function getOjtLogs(userId: number): Map<ISODate, OjtLog> {
  const rows = db.select().from(ojtDays).where(eq(ojtDays.userId, userId)).all();
  return new Map(rows.map((r) => [r.date, { date: r.date, status: r.status, hours: r.hours, note: r.note }]));
}

/** Everything the OJT screens need, computed once. */
export function getOjtState(today: ISODate = todayManila()) {
  const p = getProfile();
  if (!p) return undefined;
  const workdays = parseWorkdays(p.profile.workdays);
  const hol = getHolidayMap(p.user.region);
  const logs = getOjtLogs(p.user.id);
  const logList = [...logs.values()];
  const start = p.profile.startDate;
  const totalSpent = today >= start ? sumAmount('expense', start, today) : 0;
  const projection = ojtProjection({
    totalSpent,
    oneTimeSpent: today >= start ? sumOneTime(start, today) : 0,
    hoursDone: hoursDone(logList),
    daysWorked: daysWorked(logList),
    requiredHours: p.profile.requiredHours,
    hoursPerDay: p.profile.hoursPerDay,
    fromDate: today < start ? start : logs.has(today) ? addDays(today, 1) : today,
    workdays,
    holidays: new Set(hol.keys()),
  });
  return {
    totalSpent,
    projection,
    userId: p.user.id,
    today,
    startDate: p.profile.startDate,
    hoursPerDay: p.profile.hoursPerDay,
    requiredHours: p.profile.requiredHours,
    workdays,
    holidays: hol,
    logs,
    timeline: ojtTimeline(p.profile.startDate, today, workdays, hol, logs),
    unlogged: unloggedWorkdays(p.profile.startDate, today, workdays, hol, logs),
    hoursDone: hoursDone([...logs.values()]),
  };
}

export type OjtState = NonNullable<ReturnType<typeof getOjtState>>;

export function useOjtState() {
  return useDbQuery(() => getOjtState(), OJT_TABLES);
}

/** Insert or replace one day's log. */
export function setOjtDay(userId: number, date: ISODate, status: OjtStatus, hours: number, note: string | null = null): void {
  db.insert(ojtDays)
    .values({ userId, date, status, hours, note })
    .onConflictDoUpdate({ target: [ojtDays.userId, ojtDays.date], set: { status, hours, note } })
    .run();
}

export function clearOjtDay(userId: number, date: ISODate): void {
  db.delete(ojtDays).where(and(eq(ojtDays.userId, userId), eq(ojtDays.date, date))).run();
}

/** "Mark all as worked": log every given unlogged workday with the usual hours, in one transaction. */
export function markWorked(userId: number, dates: ISODate[], hours: number): void {
  if (dates.length === 0) return;
  db.transaction((tx) => {
    const existing = new Set(
      tx.select({ date: ojtDays.date }).from(ojtDays).where(and(eq(ojtDays.userId, userId), inArray(ojtDays.date, dates))).all().map((r) => r.date),
    );
    for (const date of dates) {
      if (!existing.has(date)) tx.insert(ojtDays).values({ userId, date, status: 'worked', hours }).run();
    }
  });
}

/** Restore days exactly as they were (Undo for "Mark all as worked"). */
export function removeOjtDays(userId: number, dates: ISODate[]): void {
  if (dates.length === 0) return;
  db.delete(ojtDays).where(and(eq(ojtDays.userId, userId), inArray(ojtDays.date, dates))).run();
}
