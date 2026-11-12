import { averagePerDay, barFractions, dayCount, highlightIndex, reportRange, spendingSeries, withShares } from '../src/lib/reports';

describe('report ranges', () => {
  it('week = Monday→today, month = 1st→today, OJT = start→today', () => {
    expect(reportRange('week', '2026-11-12', '2026-11-09')).toEqual({ from: '2026-11-09', to: '2026-11-12' });
    expect(reportRange('month', '2026-11-12', '2026-11-09')).toEqual({ from: '2026-11-01', to: '2026-11-12' });
    expect(reportRange('ojt', '2026-11-12', '2026-11-09')).toEqual({ from: '2026-11-09', to: '2026-11-12' });
    expect(reportRange('ojt', '2026-11-05', '2026-11-09')).toEqual({ from: '2026-11-05', to: '2026-11-05' });
  });
  it('day count and average', () => {
    expect(dayCount('2026-11-09', '2026-11-12')).toBe(4);
    expect(averagePerDay(1000_00, 4)).toBe(250_00);
    expect(averagePerDay(100, 3)).toBe(33);
  });
});

describe('series', () => {
  const daily = new Map([
    ['2026-11-09', 200_00],
    ['2026-11-11', 50_00],
  ]);
  it('fills missing days with 0 and labels weekdays for a week', () => {
    const s = spendingSeries(daily, '2026-11-09', '2026-11-12');
    expect(s.map((p) => [p.label, p.amount])).toEqual([
      ['M', 200_00],
      ['T', 0],
      ['W', 50_00],
      ['T', 0],
    ]);
  });
  it('labels day numbers for a month', () => {
    expect(spendingSeries(daily, '2026-11-01', '2026-11-12')[8]).toEqual({ key: '2026-11-09', label: '9', amount: 200_00 });
  });
  it('groups by week beyond 31 days', () => {
    const s = spendingSeries(new Map([['2026-11-10', 100], ['2026-11-12', 50], ['2026-12-20', 7]]), '2026-11-09', '2026-12-20');
    expect(s[0]).toEqual({ key: '2026-11-09', label: 'Nov 9', amount: 150 });
    expect(s).toHaveLength(6);
    expect(s[s.length - 1]).toEqual({ key: '2026-12-14', label: 'Dec 14', amount: 7 });
  });
});

describe('bars', () => {
  it('fractions relative to the max, with a sliver for small values', () => {
    expect(barFractions([0, 50, 100])).toEqual([0, 0.5, 1]);
    expect(barFractions([1, 1000])[0]).toBe(0.02);
    expect(barFractions([0, 0])).toEqual([0, 0]);
  });
  it('highlights the largest bar only', () => {
    expect(highlightIndex([10, 30, 20])).toBe(1);
    expect(highlightIndex([0, 0])).toBe(-1);
  });
  it('category shares, sorted, zeros dropped', () => {
    expect(withShares([{ n: 'Food', amount: 300 }, { n: 'Fare', amount: 100 }, { n: 'Gala', amount: 0 }])).toEqual([
      { n: 'Food', amount: 300, pct: 75 },
      { n: 'Fare', amount: 100, pct: 25 },
    ]);
  });
});
