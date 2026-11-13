import type { FareRuleInput } from '../src/lib/fare';
import { barkadaVisible, featuresFor, isModeAllowed } from '../src/lib/region';
import { legKm, parseKm, parseLegText, routeTotals, TRIP_LABEL, tripFare, tripTimes, validateLeg, type LegValues } from '../src/lib/route';

describe('usual trip (round trip / one way)', () => {
  it('round trip = 2 rides, one way = 1', () => {
    expect(tripTimes('round')).toBe(2);
    expect(tripTimes('one_way')).toBe(1);
  });
  it('fare shown follows the route’s usual trip, in whole centavos', () => {
    const totals = { oneWay: 4_225 }; // ₱42.25
    expect(tripFare(totals, 'round')).toBe(8_450);
    expect(tripFare(totals, 'one_way')).toBe(4_225);
  });
  it('labels', () => {
    expect(TRIP_LABEL.round).toBe('Round trip');
    expect(TRIP_LABEL.one_way).toBe('One way');
  });
});

const jeep: FareRuleInput = { baseFare: 1400, baseKm: 4, perKm: 200, studentPct: 20, promoPct: 0, roundTo: 25, isFixed: false };
const mrt: FareRuleInput = { baseFare: 0, baseKm: 0, perKm: 0, studentPct: 50, promoPct: 50, roundTo: 25, isFixed: true };
const leg = (p: Partial<LegValues>): LegValues => ({ kmEstimated: null, kmActual: null, fixedFare: null, discountApplies: true, ...p });

describe('routeTotals', () => {
  it('jeep 6 km (student) + MRT fixed ₱15 = ₱30.00 one way, ₱60.00 round trip', () => {
    // jeep: 1400 + 2×200 = 1800 → −20% = 1440 → nearest ₱0.25 = 1450
    const t = routeTotals(
      [
        { rule: jeep, leg: leg({ kmEstimated: 6 }) },
        { rule: mrt, leg: leg({ fixedFare: 1550 }) },
      ],
      true,
    );
    expect(t).toEqual({ oneWay: 1450 + 1550, oneWayRegular: 1800 + 1550, roundTrip: (1450 + 1550) * 2 });
  });
  it('uses actual km over the estimate', () => {
    expect(legKm({ kmEstimated: 6, kmActual: 9 })).toBe(9);
    expect(routeTotals([{ rule: jeep, leg: leg({ kmEstimated: 4, kmActual: 7 }) }], false).oneWay).toBe(2000);
  });
  it('no student discount when the leg toggle is off or the user is not a student', () => {
    expect(routeTotals([{ rule: jeep, leg: leg({ kmEstimated: 4, discountApplies: false }) }], true).oneWay).toBe(1400);
    expect(routeTotals([{ rule: jeep, leg: leg({ kmEstimated: 4 }) }], false).oneWay).toBe(1400);
  });
  it('ignores a stale fixed fare on a formula leg', () => {
    expect(routeTotals([{ rule: jeep, leg: leg({ kmEstimated: 4, fixedFare: 99900 }) }], true).oneWay).toBe(1125);
  });
  it('empty route costs ₱0', () => {
    expect(routeTotals([], true)).toEqual({ oneWay: 0, oneWayRegular: 0, roundTrip: 0 });
  });
});

describe('validateLeg / parseKm', () => {
  it('formula legs need km, fixed legs need a fare (₱0 allowed for walking)', () => {
    expect(validateLeg(jeep, leg({}))).not.toBeNull();
    expect(validateLeg(jeep, leg({ kmEstimated: 5 }))).toBeNull();
    expect(validateLeg(jeep, leg({ kmEstimated: 999 }))).not.toBeNull();
    expect(validateLeg(mrt, leg({}))).not.toBeNull();
    expect(validateLeg(mrt, leg({ fixedFare: 0 }))).toBeNull();
  });
  it('parses km text', () => {
    expect(parseKm('12.5')).toBe(12.5);
    expect(parseKm('12,5')).toBe(12.5);
    expect(parseKm(' ')).toBeNull();
    expect(parseKm('abc')).toBeNaN();
  });
});

describe('parseLegText', () => {
  const text = { kmEstText: '', kmActText: '', fareText: '', discountApplies: true };
  it('reads km for formula rules and ignores the fare field', () => {
    expect(parseLegText(jeep, { ...text, kmEstText: '6', kmActText: '6.4', fareText: '99' })).toEqual({
      ok: true,
      values: { kmEstimated: 6, kmActual: 6.4, fixedFare: null, discountApplies: true },
    });
  });
  it('reads the fare in centavos for fixed rules', () => {
    expect(parseLegText(mrt, { ...text, fareText: '15.50' })).toEqual({
      ok: true,
      values: { kmEstimated: null, kmActual: null, fixedFare: 1550, discountApplies: true },
    });
  });
  it('reports bad input', () => {
    expect(parseLegText(jeep, { ...text, kmEstText: 'six' }).ok).toBe(false);
    expect(parseLegText(jeep, text).ok).toBe(false);
    expect(parseLegText(mrt, { ...text, fareText: 'x' }).ok).toBe(false);
  });
});

describe('region rules', () => {
  it('Bicol hides trains and the EDSA Carousel; Metro Manila keeps them', () => {
    for (const mode of ['lrt1', 'lrt2', 'mrt3', 'bus_edsa_carousel']) {
      expect(isModeAllowed('REGION_V', mode)).toBe(false);
      expect(isModeAllowed('NCR', mode)).toBe(true);
    }
    expect(isModeAllowed('REGION_V', 'tricycle')).toBe(true);
  });
  it('barkada features: Metro Manila only, same region only', () => {
    expect(featuresFor('REGION_V')).toEqual({ trains: false, carousel: false, barkada: false });
    expect(barkadaVisible('NCR', 'NCR')).toBe(true);
    expect(barkadaVisible('REGION_V', 'REGION_V')).toBe(false);
    expect(barkadaVisible('REGION_V', 'NCR')).toBe(false);
  });
});
