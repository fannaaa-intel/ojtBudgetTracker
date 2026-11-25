import {
  budgetStatus,
  countedDays,
  countsDay,
  dailyShare,
  effectiveDays,
  isDutyDay,
  daysLeftInPeriod,
  daysLeftInWeek,
  periodRange,
  previousPeriodRange,
  progressPct,
  rolloverCarry,
  safeToSpendToday,
} from '../src/lib/budget';

describe('periods', () => {
  it('weeks run Monday to Sunday', () => {
    expect(periodRange('weekly', '2026-11-12')).toEqual({ from: '2026-11-09', to: '2026-11-15' });
    expect(periodRange('weekly', '2026-11-15')).toEqual({ from: '2026-11-09', to: '2026-11-15' }); // Sunday
    expect(periodRange('weekly', '2026-11-16')).toEqual({ from: '2026-11-16', to: '2026-11-22' }); // Monday
  });
  it('months cover the whole calendar month', () => {
    expect(periodRange('monthly', '2026-11-12')).toEqual({ from: '2026-11-01', to: '2026-11-30' });
    expect(periodRange('monthly', '2027-02-03')).toEqual({ from: '2027-02-01', to: '2027-02-28' });
  });
  it('previous period', () => {
    expect(previousPeriodRange('weekly', '2026-11-12')).toEqual({ from: '2026-11-02', to: '2026-11-08' });
    expect(previousPeriodRange('monthly', '2027-01-10')).toEqual({ from: '2026-12-01', to: '2026-12-31' });
  });
});

describe('budgetStatus', () => {
  it('ok below 80%, near from 80%, over from 100%', () => {
    expect(budgetStatus(79_99, 100_00)).toBe('ok');
    expect(budgetStatus(80_00, 100_00)).toBe('near');
    expect(budgetStatus(99_99, 100_00)).toBe('near');
    expect(budgetStatus(100_00, 100_00)).toBe('over');
    expect(budgetStatus(150_00, 100_00)).toBe('over');
  });
  it('₱0 budget', () => {
    expect(budgetStatus(0, 0)).toBe('ok');
    expect(budgetStatus(1, 0)).toBe('over');
  });
  it('progress is capped at 100', () => {
    expect(progressPct(50_00, 200_00)).toBe(25);
    expect(progressPct(300_00, 200_00)).toBe(100);
  });
});

describe('rollover', () => {
  it('carries leftover only, never overspending', () => {
    expect(rolloverCarry(true, 1000_00, 800_00)).toBe(200_00);
    expect(rolloverCarry(true, 1000_00, 1200_00)).toBe(0);
    expect(rolloverCarry(false, 1000_00, 800_00)).toBe(0);
  });
});

describe('safe to spend today', () => {
  it('days left counts today; Monday = 7, Sunday = 1', () => {
    expect(daysLeftInWeek('2026-11-09')).toBe(7);
    expect(daysLeftInWeek('2026-11-12')).toBe(4); // Thu
    expect(daysLeftInWeek('2026-11-15')).toBe(1);
  });
  it('(week budget − spent before today) ÷ days left, floored to the centavo', () => {
    // ₱1,000 week, ₱300 spent Mon–Wed, Thursday → 700 / 4 = ₱175 per day
    expect(safeToSpendToday(1000_00, 300_00, 50_00, '2026-11-12')).toEqual({ dailyLimit: 175_00, spentToday: 50_00, left: 125_00, daysLeft: 4, period: 'weekly' });
    // ₱100 over 3 days → 3333.33 centavos → 3333
    expect(safeToSpendToday(100_00, 0, 0, '2026-11-13').dailyLimit).toBe(3333);
  });
  it('monthly: (month budget − spent before today) ÷ days left in the month', () => {
    expect(daysLeftInPeriod('monthly', '2026-11-12')).toBe(19);
    expect(daysLeftInPeriod('monthly', '2026-11-30')).toBe(1);
    expect(daysLeftInPeriod('monthly', '2027-02-01')).toBe(28);
    // ₱5,000 month, ₱1,200 spent Nov 1–11 → 3,800 / 19 = ₱200 per day
    expect(safeToSpendToday(5000_00, 1200_00, 0, '2026-11-12', 'monthly')).toMatchObject({ dailyLimit: 200_00, daysLeft: 19, period: 'monthly' });
  });
  it('never negative when the week is already overspent; left can go negative', () => {
    const r = safeToSpendToday(500_00, 600_00, 20_00, '2026-11-12');
    expect(r.dailyLimit).toBe(0);
    expect(r.left).toBe(-20_00);
  });
});

describe('duty-day budgets (₱1,000 covers Mon–Fri; weekends vary)', () => {
  const monFri = { workdays: [1, 2, 3, 4, 5], holidays: new Set<string>() };
  // Week of Nov 23–29, 2026; Nov 30 (Mon) is Bonifacio Day.
  const withHoliday = { workdays: [1, 2, 3, 4, 5], holidays: new Set(['2026-11-30']) };

  it('duty days are workdays that are not holidays', () => {
    expect(isDutyDay('2026-11-23', monFri)).toBe(true); // Mon
    expect(isDutyDay('2026-11-28', monFri)).toBe(false); // Sat
    expect(isDutyDay('2026-11-29', monFri)).toBe(false); // Sun
    expect(isDutyDay('2026-11-30', withHoliday)).toBe(false); // holiday Monday
    expect(countsDay('all', '2026-11-28', monFri)).toBe(true);
  });

  it('a week has 5 duty days; a holiday week has 4', () => {
    expect(countedDays('duty', '2026-11-23', '2026-11-29', monFri)).toEqual(['2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27']);
    expect(countedDays('duty', '2026-11-30', '2026-12-06', withHoliday)).toHaveLength(4);
    expect(countedDays('all', '2026-11-23', '2026-11-29', monFri)).toHaveLength(7);
    expect(countedDays('duty', '2026-11-25', '2026-11-24', monFri)).toEqual([]);
  });

  it('₱1,000 on Monday → ₱200 a day (not ₱142.85 over 7 days)', () => {
    expect(dailyShare(1000_00, 0, countedDays('duty', '2026-11-23', '2026-11-29', monFri).length)).toBe(200_00);
  });

  it('Wednesday after ₱450 spent Mon–Tue → ₱550 ÷ 3 duty days = ₱183.33', () => {
    expect(dailyShare(1000_00, 450_00, countedDays('duty', '2026-11-25', '2026-11-29', monFri).length)).toBe(183_33);
  });

  it('Friday is the last duty day: the whole remainder is today’s share', () => {
    expect(dailyShare(1000_00, 820_00, countedDays('duty', '2026-11-27', '2026-11-29', monFri).length)).toBe(180_00);
  });

  it('never negative; 0 days left → 0', () => {
    expect(dailyShare(1000_00, 1200_00, 2)).toBe(0);
    expect(dailyShare(1000_00, 0, 0)).toBe(0);
  });

  it('only weekly budgets can be duty-only', () => {
    expect(effectiveDays('weekly', 'duty')).toBe('duty');
    expect(effectiveDays('monthly', 'duty')).toBe('all');
    expect(effectiveDays('weekly', 'all')).toBe('all');
  });

  it('custom schedule: Tue–Sat duty, so Monday and Sunday are off', () => {
    const tueSat = { workdays: [2, 3, 4, 5, 6], holidays: new Set<string>() };
    expect(isDutyDay('2026-11-23', tueSat)).toBe(false);
    expect(isDutyDay('2026-11-28', tueSat)).toBe(true);
  });
});
