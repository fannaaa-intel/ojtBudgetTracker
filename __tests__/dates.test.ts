import {
  countWorkdays,
  formatDateLabel,
  formatWeekdays,
  isoToPickerDate,
  isValidISO,
  msUntilManilaMidnight,
  pickerDateToISO,
  projectEndDate,
  startOfWeek,
  weekday,
} from '../src/lib/dates';

describe('msUntilManilaMidnight', () => {
  it('counts to 00:00 Manila (UTC+8), whatever the phone timezone', () => {
    // 2026-11-25 23:00 Manila = 15:00 UTC → 1 hour left
    expect(msUntilManilaMidnight(new Date(Date.UTC(2026, 10, 25, 15, 0, 0)))).toBe(3_600_000);
    // exactly midnight Manila → a full day until the next one
    expect(msUntilManilaMidnight(new Date(Date.UTC(2026, 10, 25, 16, 0, 0)))).toBe(86_400_000);
  });
});

describe('formatWeekdays', () => {
  it('Monday first, runs of 3+ as ranges', () => {
    expect(formatWeekdays([1, 2, 3, 4, 5])).toBe('Mon–Fri');
    expect(formatWeekdays([5, 4, 3, 2, 1])).toBe('Mon–Fri');
    expect(formatWeekdays([1, 3, 5])).toBe('Mon, Wed, Fri');
    expect(formatWeekdays([6, 0])).toBe('Sat, Sun');
    expect(formatWeekdays([1, 2, 3, 4, 5, 6])).toBe('Mon–Sat');
    expect(formatWeekdays([])).toBe('No days');
  });
});
import { HOLIDAY_SEED } from '../src/db/seed/holidays';
import { holidaysFor } from '../src/lib/seedTopUp';

// Metro Manila interns: national holidays only (Camarines Norte local days excluded).
const holidays = new Set(holidaysFor(HOLIDAY_SEED, 'NCR').map((h) => h.date));
const bicolHolidays = new Set(holidaysFor(HOLIDAY_SEED, 'REGION_V').map((h) => h.date));
const MON_FRI = [1, 2, 3, 4, 5];

describe('dates', () => {
  it('Nov 9, 2026 is a Monday', () => {
    expect(weekday('2026-11-09')).toBe(1);
  });
  it('counts workdays Nov 9–30, 2026 (Bonifacio Day excluded)', () => {
    expect(countWorkdays('2026-11-09', '2026-11-30', MON_FRI, holidays)).toBe(15);
  });
  it('projects the end date for 300 h at 5 h/day from Nov 9, 2026', () => {
    expect(projectEndDate('2026-11-09', 300, 5, MON_FRI, holidays)).toBe('2027-02-09');
  });
  it('Talisay intern ends one workday later (Feb 1 Panganiban Day is a Monday)', () => {
    expect(projectEndDate('2026-11-09', 300, 5, MON_FRI, bicolHolidays)).toBe('2027-02-10');
  });
  it('weeks start on Monday', () => {
    expect(startOfWeek('2026-11-15')).toBe('2026-11-09');
  });
});

describe('date picker helpers', () => {
  it('round-trips ISO → picker Date → ISO', () => {
    for (const d of ['2026-11-09', '2026-12-31', '2027-01-01', '2028-02-29', '2026-03-01']) {
      expect(pickerDateToISO(isoToPickerDate(d))).toBe(d);
    }
  });
  it('builds the picker Date from local parts', () => {
    const date = isoToPickerDate('2026-11-09');
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 10, 9]);
  });
  it('formats a readable label', () => {
    expect(formatDateLabel('2026-11-09')).toBe('Mon, Nov 9, 2026');
    expect(formatDateLabel('2027-01-01')).toBe('Fri, Jan 1, 2027');
  });
  it('validates real calendar days only', () => {
    expect(isValidISO('2026-11-09')).toBe(true);
    expect(isValidISO('2028-02-29')).toBe(true);
    expect(isValidISO('2026-02-29')).toBe(false);
    expect(isValidISO('2026-13-01')).toBe(false);
    expect(isValidISO('2026-1-9')).toBe(false);
  });
});
