/**
 * Fare calculator. All money is integer centavos (₱14.00 = 1400).
 *
 * Rule per leg:
 *   regular  = baseFare + max(0, ceil(km - baseKm)) * perKm
 *   discount = max(studentPct if student & leg allows it, promoPct)   // discounts never stack
 *   payable  = round(regular * (100 - discount) / 100, to nearest roundTo)
 *
 * Fixed fares (P2P, UV fixed route, tricycle, train station matrix) skip the formula.
 * This file has no imports on purpose so it can be unit-tested anywhere.
 */

export type FareRuleInput = {
  baseFare: number; // centavos
  baseKm: number; // km covered by the base fare
  perKm: number; // centavos per succeeding km
  studentPct: number; // 0-100
  promoPct: number; // 0-100, applies to everyone (e.g. LRT-2/MRT-3 50% promo)
  roundTo: number; // centavos, usually 25 (₱0.25)
  isFixed: boolean; // true = user enters the fare (no formula)
};

export type FareOptions = {
  km?: number | null;
  isStudent: boolean;
  discountApplies: boolean; // per-leg toggle (e.g. no ID today)
  fixedFare?: number | null; // centavos, used when rule.isFixed or the leg overrides
};

export type FareResult = {
  regular: number; // centavos, rounded
  payable: number; // centavos, rounded
  discountPct: number;
  source: 'formula' | 'fixed';
};

export function roundToNearest(value: number, step: number): number {
  if (step <= 0) return Math.round(value);
  return Math.round(value / step) * step;
}

/** Number of succeeding km charged. Guards against float noise (5.0 - 4 = 0.9999…). */
export function chargeableKm(km: number, baseKm: number): number {
  const extra = Math.round((km - baseKm) * 1000) / 1000;
  return extra > 0 ? Math.ceil(extra) : 0;
}

export function effectiveDiscountPct(rule: FareRuleInput, opts: FareOptions): number {
  const student = opts.isStudent && opts.discountApplies ? rule.studentPct : 0;
  return Math.max(student, rule.promoPct, 0);
}

export function computeFare(rule: FareRuleInput, opts: FareOptions): FareResult {
  const discountPct = effectiveDiscountPct(rule, opts);

  if (rule.isFixed || opts.fixedFare != null) {
    const fixed = opts.fixedFare ?? 0;
    // A fixed fare is what the user actually pays; we do not discount it again.
    return { regular: fixed, payable: fixed, discountPct: 0, source: 'fixed' };
  }

  const km = Math.max(0, opts.km ?? 0);
  const rawRegular = rule.baseFare + chargeableKm(km, rule.baseKm) * rule.perKm;
  const rawPayable = (rawRegular * (100 - discountPct)) / 100;

  return {
    regular: roundToNearest(rawRegular, rule.roundTo),
    payable: roundToNearest(rawPayable, rule.roundTo),
    discountPct,
    source: 'formula',
  };
}

/** Sum of all legs, one way. Multiply by 2 for a round trip. */
export function computeRouteFare(
  legs: { rule: FareRuleInput; opts: FareOptions }[],
): { regular: number; payable: number } {
  return legs.reduce(
    (acc, leg) => {
      const r = computeFare(leg.rule, leg.opts);
      return { regular: acc.regular + r.regular, payable: acc.payable + r.payable };
    },
    { regular: 0, payable: 0 },
  );
}
