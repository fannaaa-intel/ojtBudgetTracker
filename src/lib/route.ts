/**
 * Route math on top of fare.ts. Pure: no React, no DB. Money = integer centavos.
 * A route is an ordered list of legs; each leg uses one fare rule.
 */
import { computeFare, computeRouteFare, type FareOptions, type FareResult, type FareRuleInput } from './fare';
import { toCentavos } from './money';

export type LegValues = {
  kmEstimated: number | null;
  kmActual: number | null;
  /** Centavos the user pays on a fixed-fare leg (train matrix, tricycle, Grab). */
  fixedFare: number | null;
  discountApplies: boolean;
};

export const MAX_LEG_KM = 300;

/** Actual km wins over the estimate. */
export function legKm(leg: Pick<LegValues, 'kmEstimated' | 'kmActual'>): number | null {
  return leg.kmActual ?? leg.kmEstimated ?? null;
}

export function legFareOptions(rule: FareRuleInput, leg: LegValues, isStudent: boolean): FareOptions {
  return {
    km: legKm(leg),
    isStudent,
    discountApplies: leg.discountApplies,
    // Formula legs never carry a fixed fare, so a stale value can't override the formula.
    fixedFare: rule.isFixed ? (leg.fixedFare ?? 0) : null,
  };
}

export function legFare(rule: FareRuleInput, leg: LegValues, isStudent: boolean): FareResult {
  return computeFare(rule, legFareOptions(rule, leg, isStudent));
}

export type RouteTotals = { oneWay: number; oneWayRegular: number; roundTrip: number };

export function routeTotals(legs: { rule: FareRuleInput; leg: LegValues }[], isStudent: boolean): RouteTotals {
  const t = computeRouteFare(legs.map(({ rule, leg }) => ({ rule, opts: legFareOptions(rule, leg, isStudent) })));
  return { oneWay: t.payable, oneWayRegular: t.regular, roundTrip: t.payable * 2 };
}

/** How the intern usually rides a route: there and back the same day, or one way only. */
export type TripType = 'round' | 'one_way';

export const TRIP_LABEL: Record<TripType, string> = { round: 'Round trip', one_way: 'One way' };

/** Rides per log: 2 for a round trip, 1 for one way. */
export function tripTimes(trip: TripType): number {
  return trip === 'round' ? 2 : 1;
}

/** The fare for the route's usual trip (what the Commute tab shows and the Add tab logs by default). */
export function tripFare(totals: Pick<RouteTotals, 'oneWay'>, trip: TripType): number {
  return totals.oneWay * tripTimes(trip);
}

/** Problem with one leg, or null when it can be priced. */
export function validateLeg(rule: FareRuleInput, leg: LegValues): string | null {
  if (rule.isFixed) {
    if (leg.fixedFare == null || leg.fixedFare < 0) return 'Enter the fare you pay';
    return null;
  }
  const km = legKm(leg);
  if (km == null || km <= 0) return 'Enter the distance in km';
  if (km > MAX_LEG_KM) return 'That distance looks too long';
  return null;
}

/** "12.5" / "12,5" → 12.5 km; blank → null; invalid → NaN. */
export function parseKm(text: string): number | null {
  const t = text.trim().replace(',', '.');
  if (t === '') return null;
  return /^\d+(\.\d+)?$/.test(t) ? Number(t) : NaN;
}

/** Text fields of a leg in the route editor. */
export type LegText = { kmEstText: string; kmActText: string; fareText: string; discountApplies: boolean };

/**
 * Editor text → LegValues, or an error message. Only the fields the rule uses are read:
 * fixed rules read the fare, formula rules read the km.
 */
export function parseLegText(rule: FareRuleInput, t: LegText): { ok: true; values: LegValues } | { ok: false; error: string } {
  let values: LegValues = { kmEstimated: null, kmActual: null, fixedFare: null, discountApplies: t.discountApplies };
  if (rule.isFixed) {
    const fare = t.fareText.trim() === '' ? null : toCentavos(t.fareText);
    if (t.fareText.trim() !== '' && fare == null) return { ok: false, error: 'Enter the fare like 15 or 15.50' };
    values = { ...values, fixedFare: fare };
  } else {
    const est = parseKm(t.kmEstText);
    const act = parseKm(t.kmActText);
    if (Number.isNaN(est) || Number.isNaN(act)) return { ok: false, error: 'Enter km like 6 or 6.5' };
    values = { ...values, kmEstimated: est, kmActual: act };
  }
  const problem = validateLeg(rule, values);
  return problem ? { ok: false, error: problem } : { ok: true, values };
}
