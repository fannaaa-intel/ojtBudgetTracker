import { emergencyTarget, goalPct, validateGoal, weeklyToReach } from '../src/lib/savings';

describe('savings', () => {
  it('progress percent, capped', () => {
    expect(goalPct(2500_00, 10000_00)).toBe(25);
    expect(goalPct(12000_00, 10000_00)).toBe(100);
    expect(goalPct(0, 0)).toBe(0);
  });
  it('emergency target = 1 month of needs, scaled from shorter history', () => {
    expect(emergencyTarget(9000_00, 30)).toBe(9000_00);
    expect(emergencyTarget(9000_00, 45)).toBe(9000_00); // window is 30 days max
    expect(emergencyTarget(3000_00, 10)).toBe(9000_00);
    expect(emergencyTarget(1000_00, 7)).toBe(428571); // ₱4,285.71
    expect(emergencyTarget(0, 10)).toBe(0);
    expect(emergencyTarget(500_00, 0)).toBe(0);
  });
  it('weekly amount to reach a deadline', () => {
    // ₱3,000 left over 28 days (4 weeks) → ₱750/week
    expect(weeklyToReach(2000_00, 5000_00, '2026-11-12', '2026-12-10')).toBe(750_00);
    expect(weeklyToReach(5000_00, 5000_00, '2026-11-12', '2026-12-10')).toBe(0);
    expect(weeklyToReach(0, 1000_00, '2026-11-12', '2026-11-10')).toBe(1000_00); // deadline passed
    expect(weeklyToReach(0, 1000_00, '2026-11-12', null)).toBeNull();
  });
  it('validates the goal form', () => {
    expect(validateGoal({ name: 'Laptop', targetText: '25000', openingText: '', deadline: null })).toEqual({ ok: true, target: 2500000, opening: 0 });
    const r = validateGoal({ name: '', targetText: '0', openingText: 'x', deadline: '2026-02-30' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['deadline', 'name', 'opening', 'target']);
  });
});
