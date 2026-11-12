import { computeSplit, splitAvailable } from '../src/lib/split';

const rm = (...shares: number[]) => shares.map((share, i) => ({ roommateId: i + 1, share }));

describe('computeSplit', () => {
  it('equal: everyone incl. me; leftover centavo is mine; adds up exactly', () => {
    const r = computeSplit(100_00, 'equal', rm(0, 0));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.split.mine).toBe(3334);
      expect(r.split.shares.map((s) => s.amount)).toEqual([3333, 3333]);
      expect(r.split.mine + r.split.shares.reduce((s, x) => s + x.amount, 0)).toBe(100_00);
    }
  });
  it('custom: my share is what is left', () => {
    const r = computeSplit(3500_00, 'custom', rm(1200_00, 1000_00));
    expect(r).toEqual({ ok: true, split: { mine: 1300_00, shares: [{ roommateId: 1, amount: 1200_00 }, { roommateId: 2, amount: 1000_00 }] } });
  });
  it('custom shares above the bill are rejected', () => {
    expect(computeSplit(1000_00, 'custom', rm(600_00, 500_00)).ok).toBe(false);
  });
  it('no split or no roommates → all mine', () => {
    expect(computeSplit(500_00, 'none', rm(100_00))).toEqual({ ok: true, split: { mine: 500_00, shares: [] } });
    expect(computeSplit(500_00, 'equal', [])).toEqual({ ok: true, split: { mine: 500_00, shares: [] } });
  });
  it('split only when renting or in a dorm', () => {
    expect(splitAvailable('home')).toBe(false);
    expect(splitAvailable('renting')).toBe(true);
    expect(splitAvailable('dorm')).toBe(true);
  });
});
