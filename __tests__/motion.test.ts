import { barScale, countUpValue, easeOutCubic, MOTION, staggerDelay } from '../src/lib/motion';

describe('motion', () => {
  it('keeps every animation within 300 ms', () => {
    for (const ms of [MOTION.enterMs, MOTION.countMs, MOTION.barMs, MOTION.snackMs]) expect(ms).toBeLessThanOrEqual(300);
  });

  it('staggers only the first items', () => {
    expect(staggerDelay(0)).toBe(0);
    expect(staggerDelay(1)).toBe(MOTION.staggerMs);
    expect(staggerDelay(3, 100)).toBe(100 + 3 * MOTION.staggerMs);
    expect(staggerDelay(50)).toBe(MOTION.maxStaggered * MOTION.staggerMs);
    expect(staggerDelay(-2)).toBe(0);
  });

  it('eases out and clamps', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(2)).toBe(1);
    expect(easeOutCubic(-1)).toBe(0);
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5); // ease-out is ahead of linear
  });

  it('counts money in whole centavos and lands exactly on the target', () => {
    for (let t = 0; t <= 1; t += 0.1) expect(Number.isInteger(countUpValue(0, 18_225, t))).toBe(true);
    expect(countUpValue(0, 18_225, 0)).toBe(0);
    expect(countUpValue(0, 18_225, 1)).toBe(18_225);
    expect(countUpValue(500_00, 120_00, 1)).toBe(120_00); // counting down works too
    expect(countUpValue(0, 4.5, 1, false)).toBe(4.5);
    expect(countUpValue(0, 10, 0.5, false)).toBeCloseTo(8.75);
  });

  it('maps percentages to bar scale', () => {
    expect(barScale(50)).toBe(0.5);
    expect(barScale(140)).toBe(1);
    expect(barScale(-5)).toBe(0);
    expect(barScale(NaN)).toBe(0);
  });
});
