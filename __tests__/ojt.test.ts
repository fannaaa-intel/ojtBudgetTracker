import { HOLIDAY_SEED } from '../src/db/seed/holidays';
import {
  daysWorked,
  hoursDone,
  normalizeLogHours,
  ojtProjection,
  ojtTimeline,
  parseWorkdays,
  todayKind,
  unloggedWorkdays,
  type OjtLog,
} from '../src/lib/ojt';

const holidays = new Map(HOLIDAY_SEED.map((h) => [h.date, h.name]));
const MON_FRI = [1, 2, 3, 4, 5];
const logs = (...l: OjtLog[]) => new Map(l.map((x) => [x.date, x]));

describe('OJT hours', () => {
  it('parses workdays', () => {
    expect(parseWorkdays('1,2,3,4,5')).toEqual(MON_FRI);
    expect(parseWorkdays('1, 3,x,9')).toEqual([1, 3]);
  });
  it('worked and WFH count; absent and holiday do not', () => {
    const l: OjtLog[] = [
      { date: '2026-11-09', status: 'worked', hours: 5 },
      { date: '2026-11-10', status: 'wfh', hours: 4.5 },
      { date: '2026-11-11', status: 'absent', hours: 0 },
      { date: '2026-11-30', status: 'holiday', hours: 0 },
    ];
    expect(hoursDone(l)).toBe(9.5);
    expect(daysWorked(l)).toBe(2);
  });
  it('validates hours per status', () => {
    expect(normalizeLogHours('worked', '5')).toEqual({ ok: true, hours: 5 });
    expect(normalizeLogHours('wfh', '7,5')).toEqual({ ok: true, hours: 7.5 });
    expect(normalizeLogHours('absent', 'x')).toEqual({ ok: true, hours: 0 });
    expect(normalizeLogHours('worked', '0').ok).toBe(false);
    expect(normalizeLogHours('worked', '25').ok).toBe(false);
  });
});

describe('ojtProjection', () => {
  const base = {
    totalSpent: 0,
    oneTimeSpent: 0,
    hoursDone: 0,
    daysWorked: 0,
    requiredHours: 300 as number | null,
    hoursPerDay: 5,
    fromDate: '2026-11-09',
    workdays: MON_FRI,
    holidays: new Set(HOLIDAY_SEED.map((h) => h.date)),
  };

  it('300 h from Nov 9, 2026 at 5 h/day ends Feb 9, 2027 (60 workdays)', () => {
    const p = ojtProjection(base);
    expect(p).toMatchObject({ remainingHours: 300, endDate: '2027-02-09', workdaysLeft: 60, pctDone: 0, costPerDay: null, projectedTotal: null });
  });

  it('averages exclude one-time items; projected total adds them back', () => {
    // 4 days worked (20 h), ₱1,000 spent of which ₱200 one-time → ₱200/day, ₱40/h
    const p = ojtProjection({ ...base, totalSpent: 1000_00, oneTimeSpent: 200_00, hoursDone: 20, daysWorked: 4, fromDate: '2026-11-13' });
    expect(p.costPerDay).toBe(200_00);
    expect(p.costPerHour).toBe(40_00);
    expect(p.remainingHours).toBe(280);
    expect(p.projectedTotal).toBe(1000_00 + 200_00 * (p.workdaysLeft ?? 0));
    expect(p.workdaysLeft).toBe(56);
  });

  it('done when hours reach the requirement', () => {
    expect(ojtProjection({ ...base, hoursDone: 310, daysWorked: 62, totalSpent: 100_00 })).toMatchObject({ remainingHours: 0, workdaysLeft: 0, pctDone: 100, projectedTotal: 100_00 });
  });

  it('no required hours → cost averages only', () => {
    const p = ojtProjection({ ...base, requiredHours: null, totalSpent: 500_00, hoursDone: 10, daysWorked: 2 });
    expect(p).toMatchObject({ endDate: null, projectedTotal: null, costPerDay: 250_00, costPerHour: 50_00 });
  });
});

describe('timeline', () => {
  it('lists workdays newest first, skips weekends, marks holidays', () => {
    const t = ojtTimeline('2026-11-26', '2026-12-01', MON_FRI, holidays, logs());
    expect(t.map((e) => [e.date, e.kind])).toEqual([
      ['2026-12-01', 'workday'],
      ['2026-11-30', 'holiday'], // Bonifacio Day (Monday)
      ['2026-11-27', 'workday'],
      ['2026-11-26', 'workday'],
    ]);
    expect(t[1].holidayName).toBe('Bonifacio Day');
  });
  it('includes a logged day off (Saturday duty)', () => {
    const t = ojtTimeline('2026-11-13', '2026-11-16', MON_FRI, holidays, logs({ date: '2026-11-14', status: 'worked', hours: 4 }));
    expect(t.map((e) => [e.date, e.kind])).toEqual([
      ['2026-11-16', 'workday'],
      ['2026-11-14', 'extra'],
      ['2026-11-13', 'workday'],
    ]);
  });
  it('unlogged workdays exclude holidays and logged days', () => {
    const l = logs({ date: '2026-11-27', status: 'worked', hours: 5 });
    expect(unloggedWorkdays('2026-11-26', '2026-12-01', MON_FRI, holidays, l)).toEqual(['2026-12-01', '2026-11-26']);
  });
  it('nothing before the start date', () => {
    expect(ojtTimeline('2026-11-20', '2026-11-12', MON_FRI, holidays, logs())).toEqual([]);
  });
  it('today kind', () => {
    expect(todayKind('2026-11-12', MON_FRI, holidays)).toBe('workday');
    expect(todayKind('2026-11-30', MON_FRI, holidays)).toBe('holiday');
    expect(todayKind('2026-11-14', MON_FRI, holidays)).toBe('off');
  });
});
