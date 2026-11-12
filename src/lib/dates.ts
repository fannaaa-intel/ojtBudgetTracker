/**
 * Date helpers on plain 'YYYY-MM-DD' strings (Asia/Manila calendar days).
 * Math is done in UTC so a phone's timezone can never shift a day.
 */

export type ISODate = string; // 'YYYY-MM-DD'

const DAY_MS = 86_400_000;

export function parseISO(d: ISODate): number {
  const [y, m, day] = d.split('-').map(Number);
  return Date.UTC(y, m - 1, day);
}

export function toISO(ms: number): ISODate {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(d: ISODate, n: number): ISODate {
  return toISO(parseISO(d) + n * DAY_MS);
}

/** 0 = Sunday … 6 = Saturday */
export function weekday(d: ISODate): number {
  return new Date(parseISO(d)).getUTCDay();
}

/** Today's date in Asia/Manila (UTC+8), regardless of the phone's timezone. */
export function todayManila(now: Date = new Date()): ISODate {
  return toISO(now.getTime() + 8 * 3_600_000);
}

export function isWorkday(d: ISODate, workdays: number[], holidays: Set<ISODate>): boolean {
  return workdays.includes(weekday(d)) && !holidays.has(d);
}

/**
 * Projected last OJT day.
 * @param fromDate first day still to work (e.g. tomorrow, or the start date)
 * @param remainingHours required hours minus hours already logged
 */
export function projectEndDate(
  fromDate: ISODate,
  remainingHours: number,
  hoursPerDay: number,
  workdays: number[],
  holidays: Set<ISODate>,
): ISODate | null {
  if (remainingHours <= 0) return fromDate;
  if (hoursPerDay <= 0 || workdays.length === 0) return null;
  let left = remainingHours;
  let d = fromDate;
  for (let guard = 0; guard < 3660; guard++) {
    if (isWorkday(d, workdays, holidays)) {
      left -= hoursPerDay;
      if (left <= 0) return d;
    }
    d = addDays(d, 1);
  }
  return null;
}

/** Count workdays in [from, to] inclusive. */
export function countWorkdays(from: ISODate, to: ISODate, workdays: number[], holidays: Set<ISODate>): number {
  let count = 0;
  for (let d = from; parseISO(d) <= parseISO(to); d = addDays(d, 1)) {
    if (isWorkday(d, workdays, holidays)) count++;
  }
  return count;
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** True for a real calendar day in 'YYYY-MM-DD' form (rejects 2026-02-30). */
export function isValidISO(d: string): boolean {
  return ISO_RE.test(d) && toISO(parseISO(d)) === d;
}

/**
 * ISO day → Date for the native date picker. Built from parts (local time, noon) so the
 * picker shows the same calendar day in any timezone. Never parse 'YYYY-MM-DD' with new Date(string).
 */
export function isoToPickerDate(d: ISODate): Date {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day, 12, 0, 0, 0);
}

/** Date chosen in the native picker → ISO day, read from local parts (what the user tapped). */
export function pickerDateToISO(date: Date): ISODate {
  const y = date.getFullYear().toString().padStart(4, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** '2026-11-09' → 'Mon, Nov 9, 2026'. Manual on purpose (no Intl on Hermes). */
export function formatDateLabel(d: ISODate): string {
  const [y, m, day] = d.split('-').map(Number);
  return `${WEEKDAYS[weekday(d)]}, ${MONTHS[m - 1]} ${day}, ${y}`;
}

/** PH-style month abbreviations for long-form dates ("Sept 28, 2026"). */
const MONTHS_PH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

/** '2026-09-28' → 'Sept 28, 2026' (no weekday). */
export function formatMonthDayYear(d: ISODate): string {
  const [y, m, day] = d.split('-').map(Number);
  return `${MONTHS_PH[m - 1]} ${day}, ${y}`;
}

/** Monday of the week containing d (weeks start Monday). */
export function startOfWeek(d: ISODate): ISODate {
  const wd = weekday(d);
  return addDays(d, wd === 0 ? -6 : 1 - wd);
}
