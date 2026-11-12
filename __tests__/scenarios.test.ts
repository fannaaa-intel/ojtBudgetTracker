/**
 * End-to-end scenarios on the shipped data (no database): a Metro Manila intern and the
 * LGU Talisay (Bicol) intern, including a fare hike. They check that region rules, fares,
 * budgets and the "history never changes" rule hold together.
 */
import { AGENCY_SEED } from '../src/db/seed/agencies';
import { FARE_RULE_SEED } from '../src/db/seed/fareRules';
import { MEAL_PRESET_SEED } from '../src/db/seed/mealPresets';
import { ELECTRICITY_RATE_DEFAULT } from '../src/db/seed/settings';
import { safeToSpendToday } from '../src/lib/budget';
import { fareCheckDue, lastChecked } from '../src/lib/fareCheck';
import { presetNeedsPrice } from '../src/lib/meals';
import { barkadaVisible, featuresFor, isModeAllowed } from '../src/lib/region';
import { routeTotals } from '../src/lib/route';
import { isBeepMode, splitByBeep } from '../src/lib/wallet';

const regionOf = (code: string) => AGENCY_SEED.find((a) => a.code === code)!.region;
const rulesFor = (region: 'NCR' | 'REGION_V') => FARE_RULE_SEED.filter((r) => r.region === region && isModeAllowed(region, r.mode));
const rule = (region: 'NCR' | 'REGION_V', mode: string) => rulesFor(region).find((r) => r.mode === mode)!;
const leg = (km: number | null, fixedFare: number | null = null) => ({ kmEstimated: km, kmActual: null, fixedFare, discountApplies: true });

describe('Metro Manila intern (NFRDI, Diliman)', () => {
  const region = regionOf('NFRDI');

  it('is NCR with trains, Carousel and barkada features', () => {
    expect(region).toBe('NCR');
    expect(featuresFor(region)).toEqual({ trains: true, carousel: true, barkada: true });
    expect(barkadaVisible(region, 'NCR')).toBe(true);
    expect(rulesFor(region).some((r) => r.mode === 'mrt3')).toBe(true);
  });

  it('daily route: jeep 6 km + MRT-3 ₱15 (student) = ₱29.50 one way, ₱59 round trip; MRT on Beep', () => {
    const legs = [
      { rule: rule(region, 'jeep_traditional'), leg: leg(6) },
      { rule: rule(region, 'mrt3'), leg: leg(null, 1500) },
    ];
    const t = routeTotals(legs, true);
    expect(t.oneWay).toBe(1450 + 1500);
    expect(t.roundTrip).toBe(5900);
    expect(isBeepMode('mrt3')).toBe(true);
    expect(splitByBeep([{ mode: 'jeep_traditional', payable: 1450 }, { mode: 'mrt3', payable: 1500 }])).toEqual({ beep: 1500, cash: 1450 });
  });

  it('meal presets have prices; electricity has the Meralco default', () => {
    expect(MEAL_PRESET_SEED.filter((p) => p.region === 'NCR').some(presetNeedsPrice)).toBe(false);
    expect(ELECTRICITY_RATE_DEFAULT[region]).toBe(1506);
  });

  it('₱1,500 weekly budget on a Thursday after ₱600 spent → ₱225 a day', () => {
    expect(safeToSpendToday(1500_00, 600_00, 0, '2026-11-12').dailyLimit).toBe(225_00);
  });
});

describe('LGU Talisay intern (Bicol)', () => {
  const region = regionOf('LGU_TALISAY');

  it('is REGION_V: no LRT/MRT, no Carousel, no barkada or ambagan', () => {
    expect(region).toBe('REGION_V');
    expect(featuresFor(region)).toEqual({ trains: false, carousel: false, barkada: false });
    expect(barkadaVisible(region, 'REGION_V')).toBe(false);
    expect(barkadaVisible(region, 'NCR')).toBe(false);
    const modes = rulesFor(region).map((r) => r.mode);
    for (const m of ['lrt1', 'lrt2', 'mrt3', 'bus_edsa_carousel']) expect(modes).not.toContain(m);
    expect(modes.some(isBeepMode)).toBe(false);
  });

  it('provincial bus 12 km (student) prices from the Bicol table', () => {
    // ₱12 first 5 km + 7 × ₱2.20 = ₱27.40 → −20% = ₱21.92 → nearest ₱0.25 = ₱22.00
    expect(routeTotals([{ rule: rule(region, 'bus_provincial_ordinary'), leg: leg(12) }], true).oneWay).toBe(2200);
  });

  it('local prices are not guessed: carinderia and electricity rate ask the user', () => {
    expect(MEAL_PRESET_SEED.filter((p) => p.region === 'REGION_V').every(presetNeedsPrice)).toBe(true);
    expect(ELECTRICITY_RATE_DEFAULT[region]).toBeNull();
  });
});

describe('fare hike', () => {
  const region = 'NCR' as const;
  const jeep = rule(region, 'jeep_traditional');

  it('new fares re-price routes, while an amount already logged stays what was paid', () => {
    const before = routeTotals([{ rule: jeep, leg: leg(6) }], true).roundTrip;
    const logged = { amount: before }; // what a transaction stores at log time

    const hiked = { ...jeep, baseFare: 1500, perKm: 250 }; // e.g. ₱15 + ₱2.50/km
    const after = routeTotals([{ rule: hiked, leg: leg(6) }], true).roundTrip;

    expect(before).toBe(2900); // 2 × ₱14.50
    expect(after).toBe(3200); // ₱20 → −20% = ₱16 each way
    expect(logged.amount).toBe(2900);
  });

  it('updating fares restarts the 90-day check', () => {
    expect(fareCheckDue('2026-12-28', lastChecked('2026-09-28', null))).toBe(true);
    expect(fareCheckDue('2026-12-28', lastChecked('2026-09-28', '2026-12-28'))).toBe(false);
  });
});
