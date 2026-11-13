import { HOLIDAY_SEED } from '../src/db/seed/holidays';
import { isValidISO, weekday } from '../src/lib/dates';
import { holidaysFor } from '../src/lib/seedTopUp';

describe('holiday seed', () => {
  it('has valid, unique dates', () => {
    const dates = HOLIDAY_SEED.map((h) => h.date);
    for (const d of dates) expect(isValidISO(d)).toBe(true);
    expect(new Set(dates).size).toBe(dates.length);
  });

  it('matches Proclamation 1427 weekdays for 2027 (0 = Sunday)', () => {
    const day = (d: string) => weekday(d);
    expect(day('2027-01-01')).toBe(5); // Friday
    expect(day('2027-03-25')).toBe(4); // Maundy Thursday
    expect(day('2027-03-26')).toBe(5); // Good Friday
    expect(day('2027-04-09')).toBe(5); // Araw ng Kagitingan, Friday
    expect(day('2027-08-30')).toBe(1); // National Heroes Day, last Monday of August
    expect(day('2027-11-30')).toBe(2); // Bonifacio Day, Tuesday
  });

  it('does not list the EDSA special working day', () => {
    expect(HOLIDAY_SEED.some((h) => h.date === '2027-02-25')).toBe(false);
  });

  it('Camarines Norte days are only for the Talisay (REGION_V) intern', () => {
    const ncr = holidaysFor(HOLIDAY_SEED, 'NCR').map((h) => h.date);
    const bicol = holidaysFor(HOLIDAY_SEED, 'REGION_V').map((h) => h.date);
    expect(ncr).not.toContain('2027-09-28');
    expect(ncr).not.toContain('2027-02-01');
    expect(bicol).toContain('2027-09-28');
    expect(bicol).toContain('2027-02-01');
    expect(bicol).toContain('2027-01-01');
  });
});
