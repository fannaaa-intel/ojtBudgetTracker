import { formatMonthDayYear } from '../src/lib/dates';
import { describeFormula, fareValuesToForm, parseFareForm } from '../src/lib/fareForm';
import { formatPeso } from '../src/lib/money';

const jeep = { baseFare: 1400, baseKm: 4, perKm: 200, studentPct: 20, promoPct: 0 };

describe('fare form', () => {
  it('round-trips values → text → values', () => {
    expect(fareValuesToForm(jeep)).toEqual({ baseFareText: '14', baseKmText: '4', perKmText: '2', studentPctText: '20', promoPctText: '0' });
    expect(parseFareForm(fareValuesToForm(jeep))).toEqual({ ok: true, values: jeep });
  });
  it('parses pesos to centavos (₱2.49/km → 249)', () => {
    const r = parseFareForm({ baseFareText: '15', baseKmText: '5', perKmText: '2.49', studentPctText: '20', promoPctText: '0' });
    expect(r).toEqual({ ok: true, values: { baseFare: 1500, baseKm: 5, perKm: 249, studentPct: 20, promoPct: 0 } });
  });
  it('rejects bad numbers and out-of-range percentages', () => {
    const r = parseFareForm({ baseFareText: 'x', baseKmText: '-1', perKmText: '', studentPctText: '120', promoPctText: '5.5' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['baseFareText', 'baseKmText', 'perKmText', 'promoPctText', 'studentPctText']);
  });
  it('describes a formula in one line', () => {
    const f = (c: number) => formatPeso(c);
    expect(describeFormula(jeep, f)).toBe('₱14.00 first 4 km + ₱2.00/km');
    expect(describeFormula({ baseFare: 0, baseKm: 0, perKm: 260 }, f)).toBe('₱2.60/km');
    expect(describeFormula({ baseFare: 1625, baseKm: 0, perKm: 147 }, f)).toBe('₱16.25 base + ₱1.47/km');
  });
  it('formats the "last checked" date', () => {
    expect(formatMonthDayYear('2026-09-28')).toBe('Sept 28, 2026');
    expect(formatMonthDayYear('2027-01-01')).toBe('Jan 1, 2027');
  });
});
