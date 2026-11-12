import { chargeableKm, computeFare, computeRouteFare, type FareRuleInput } from '../src/lib/fare';

const jeep: FareRuleInput = { baseFare: 1400, baseKm: 4, perKm: 200, studentPct: 20, promoPct: 0, roundTo: 25, isFixed: false };
const bus: FareRuleInput = { baseFare: 1500, baseKm: 5, perKm: 249, studentPct: 20, promoPct: 0, roundTo: 25, isFixed: false };
const mrt: FareRuleInput = { baseFare: 0, baseKm: 0, perKm: 0, studentPct: 50, promoPct: 50, roundTo: 25, isFixed: true };

describe('computeFare', () => {
  it('traditional jeep minimum, student = ₱11.25 (official matrix)', () => {
    expect(computeFare(jeep, { km: 4, isStudent: true, discountApplies: true }).payable).toBe(1125);
  });
  it('traditional jeep 7 km regular = ₱20.00', () => {
    expect(computeFare(jeep, { km: 7, isStudent: false, discountApplies: true }).payable).toBe(2000);
  });
  it('traditional jeep 7 km student = ₱16.00', () => {
    expect(computeFare(jeep, { km: 7, isStudent: true, discountApplies: true }).payable).toBe(1600);
  });
  it('no student discount when the leg toggle is off', () => {
    expect(computeFare(jeep, { km: 4, isStudent: true, discountApplies: false }).payable).toBe(1400);
  });
  it('ordinary city bus 10 km rounds to nearest ₱0.25 = ₱27.50', () => {
    expect(computeFare(bus, { km: 10, isStudent: false, discountApplies: true }).payable).toBe(2750);
  });
  it('fixed fares are returned as entered', () => {
    expect(computeFare(mrt, { isStudent: true, discountApplies: true, fixedFare: 800 })).toMatchObject({ payable: 800, source: 'fixed' });
  });
});

describe('chargeableKm', () => {
  it('ignores float noise and charges partial km as a full km', () => {
    expect(chargeableKm(5.0, 4)).toBe(1);
    expect(chargeableKm(4.3, 4)).toBe(1);
    expect(chargeableKm(3.9, 4)).toBe(0);
  });
});

describe('computeRouteFare', () => {
  it('sums legs', () => {
    const total = computeRouteFare([
      { rule: jeep, opts: { km: 4, isStudent: true, discountApplies: true } },
      { rule: jeep, opts: { km: 5, isStudent: true, discountApplies: true } },
    ]);
    expect(total.payable).toBe(1125 + 1275);
  });
});
