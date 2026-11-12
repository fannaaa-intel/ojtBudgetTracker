import { billPeriod, billStatus, billStatusLabel, dueDateFor, kwhCost, parseKwh, parseRate, validateBill } from '../src/lib/bills';

describe('bill due dates', () => {
  it('period and due date, clamped to short months', () => {
    expect(billPeriod('2026-11-12')).toBe('2026-11');
    expect(dueDateFor('2026-11', 15)).toBe('2026-11-15');
    expect(dueDateFor('2026-11', 31)).toBe('2026-11-30');
    expect(dueDateFor('2027-02', 30)).toBe('2027-02-28');
    expect(dueDateFor('2028-02', 31)).toBe('2028-02-29');
  });
  it('status: paid, overdue, due soon (≤3 days), upcoming', () => {
    expect(billStatus('2026-11-12', '2026-11-10', true)).toBe('paid');
    expect(billStatus('2026-11-12', '2026-11-10', false)).toBe('overdue');
    expect(billStatus('2026-11-12', '2026-11-12', false)).toBe('due_soon');
    expect(billStatus('2026-11-12', '2026-11-15', false)).toBe('due_soon');
    expect(billStatus('2026-11-12', '2026-11-16', false)).toBe('upcoming');
  });
  it('labels', () => {
    expect(billStatusLabel('overdue', '2026-11-12', '2026-11-10')).toBe('Overdue 2 days');
    expect(billStatusLabel('due_soon', '2026-11-12', '2026-11-12')).toBe('Due today');
    expect(billStatusLabel('due_soon', '2026-11-12', '2026-11-13')).toBe('Due tomorrow');
    expect(billStatusLabel('upcoming', '2026-11-12', '2026-11-20')).toBe('Due in 8 days');
  });
});

describe('electricity estimator', () => {
  it('kWh × rate in centavos, rounded', () => {
    expect(kwhCost(123.4, 1506)).toBe(185840); // ₱1,858.40
    expect(kwhCost(100, 1506)).toBe(150600);
    expect(kwhCost(0.5, 1506)).toBe(753);
  });
  it('parses kWh and rates', () => {
    expect(parseKwh('123.4')).toBe(123.4);
    expect(parseKwh('0')).toBeNull();
    expect(parseKwh('abc')).toBeNull();
    expect(parseRate('15.06')).toBe(1506);
    expect(parseRate('0')).toBeNull();
    expect(parseRate('150')).toBeNull(); // ₱150/kWh is a typo
  });
});

describe('validateBill', () => {
  it('fixed bill needs an amount; variable may be blank', () => {
    expect(validateBill({ name: 'Rent', amountText: '3500', dueDayText: '5', isVariable: false })).toEqual({ ok: true, amount: 350000, dueDay: 5 });
    expect(validateBill({ name: 'Electricity', amountText: '', dueDayText: '20', isVariable: true })).toEqual({ ok: true, amount: 0, dueDay: 20 });
    expect(validateBill({ name: 'Rent', amountText: '', dueDayText: '5', isVariable: false }).ok).toBe(false);
  });
  it('due day 1–31 and a name', () => {
    const r = validateBill({ name: ' ', amountText: '100', dueDayText: '32', isVariable: false });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['dueDay', 'name']);
  });
});
