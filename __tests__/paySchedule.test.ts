import { daysBetween, daysInMonth, daysUntilLabel, nextPayDate, validateIncomeSource } from '../src/lib/paySchedule';

describe('nextPayDate', () => {
  it('weekly: steps 7 days from the anchor', () => {
    expect(nextPayDate('weekly', '2026-11-06', '2026-11-12')).toBe('2026-11-13');
    expect(nextPayDate('weekly', '2026-11-06', '2026-11-13')).toBe('2026-11-13'); // payday is today
    expect(nextPayDate('weekly', '2026-11-20', '2026-11-12')).toBe('2026-11-20'); // anchor in the future
    expect(nextPayDate('weekly', '2026-12-25', '2027-01-02')).toBe('2027-01-08'); // across the year
    expect(nextPayDate('weekly', null, '2026-11-12')).toBeNull();
  });

  it('15th & 30th: picks the next of the two', () => {
    expect(nextPayDate('semi_monthly', null, '2026-11-12')).toBe('2026-11-15');
    expect(nextPayDate('semi_monthly', null, '2026-11-15')).toBe('2026-11-15');
    expect(nextPayDate('semi_monthly', null, '2026-11-16')).toBe('2026-11-30');
    expect(nextPayDate('semi_monthly', null, '2026-12-31')).toBe('2027-01-15'); // 31st → next month
  });
  it('15th & 30th: February uses the last day', () => {
    expect(nextPayDate('semi_monthly', null, '2027-02-16')).toBe('2027-02-28');
    expect(nextPayDate('semi_monthly', null, '2028-02-16')).toBe('2028-02-29'); // leap year
  });
  it('15th & 30th: a future anchor delays the first payday', () => {
    expect(nextPayDate('semi_monthly', '2026-12-01', '2026-11-12')).toBe('2026-12-15');
  });

  it('monthly: same day each month, clamped to short months', () => {
    expect(nextPayDate('monthly', '2026-10-05', '2026-11-12')).toBe('2026-12-05');
    expect(nextPayDate('monthly', '2026-10-31', '2026-11-12')).toBe('2026-11-30');
    expect(nextPayDate('monthly', '2026-10-31', '2027-02-01')).toBe('2027-02-28');
    expect(nextPayDate('monthly', '2026-11-12', '2026-11-12')).toBe('2026-11-12');
  });

  it('once: only if it has not passed', () => {
    expect(nextPayDate('once', '2026-11-20', '2026-11-12')).toBe('2026-11-20');
    expect(nextPayDate('once', '2026-11-01', '2026-11-12')).toBeNull();
  });
});

describe('validateIncomeSource', () => {
  it('accepts a weekly source with a payday', () => {
    expect(validateIncomeSource({ name: 'Baon', amountText: '1500', frequency: 'weekly', anchor: '2026-11-13' })).toEqual({ ok: true, amount: 150000 });
  });
  it('15th & 30th needs no date', () => {
    expect(validateIncomeSource({ name: 'Stipend', amountText: '2,500', frequency: 'semi_monthly', anchor: null }).ok).toBe(true);
  });
  it('reports missing name, amount and payday', () => {
    const r = validateIncomeSource({ name: ' ', amountText: '0', frequency: 'monthly', anchor: null });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['amount', 'anchor', 'name']);
  });
});

describe('helpers', () => {
  it('daysInMonth', () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2026, 11)).toBe(30);
  });
  it('daysBetween and labels', () => {
    expect(daysBetween('2026-11-12', '2026-11-15')).toBe(3);
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
    expect(daysUntilLabel(0)).toBe('today');
    expect(daysUntilLabel(1)).toBe('tomorrow');
    expect(daysUntilLabel(3)).toBe('in 3 days');
  });
});
