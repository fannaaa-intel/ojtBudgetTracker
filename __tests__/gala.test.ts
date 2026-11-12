import { checkAgainstAllowance, galaNote, galaTotal } from '../src/lib/gala';
import { formatPeso } from '../src/lib/money';

const parts = [
  { label: 'Fare', amount: 60_00 },
  { label: 'Food', amount: 150_00 },
  { label: 'Activity', amount: 0 },
];

describe('gala planner', () => {
  it('adds the parts (negatives ignored)', () => {
    expect(galaTotal(parts)).toBe(210_00);
    expect(galaTotal([{ label: 'x', amount: -5 }])).toBe(0);
  });
  it('writes a note with the breakdown, skipping zero parts', () => {
    expect(galaNote('SM North', parts, (c) => formatPeso(c))).toBe('SM North · Fare ₱60.00 · Food ₱150.00');
    expect(galaNote(' ', [], (c) => formatPeso(c))).toBe('Gala');
  });
  it('checks the plan against what is left of the weekly allowance', () => {
    expect(checkAgainstAllowance(210_00, { available: 500_00, spent: 100_00 })).toEqual({ leftAfter: 190_00, status: 'ok' });
    expect(checkAgainstAllowance(210_00, { available: 500_00, spent: 200_00 })).toEqual({ leftAfter: 90_00, status: 'near' });
    expect(checkAgainstAllowance(210_00, { available: 300_00, spent: 100_00 })).toEqual({ leftAfter: -10_00, status: 'over' });
    expect(checkAgainstAllowance(210_00, null)).toBeNull();
  });
});
