/**
 * Fare rules, saved routes and commute logging. Synchronous expo-sqlite.
 * Fares always come from fare_rules; a logged commute stores the amount computed at log time,
 * so later fare edits never change history.
 */
import { and, asc, count, desc, eq, inArray, max, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { fareRules, routeLegs, routes, transactions, type Region } from '@/db/schema';
import { useDbQuery } from '@/db/useDbQuery';
import { FARE_RULE_SEED } from '@/db/seed/fareRules';
import { todayManila } from '@/lib/dates';
import { fareCheckDue, lastChecked } from '@/lib/fareCheck';
import type { FareValues } from '@/lib/fareForm';
import { getSetting, setSetting } from '../settings/appSettings';
import { isModeAllowed } from '@/lib/region';
import { routeTotals, type LegValues } from '@/lib/route';
import { getProfile } from '../profile/queries';
import { addTransaction, getCategoryIdByKey, getDefaultWalletId, notDeleted } from '../transactions/queries';

export type FareRule = typeof fareRules.$inferSelect;
export type RouteRow = typeof routes.$inferSelect;
export type RouteLegRow = typeof routeLegs.$inferSelect;
export type RouteWithLegs = RouteRow & {
  legs: (RouteLegRow & { rule: FareRule })[];
  /** A leg uses another region's fare rule (the user changed agency). Can't be quick-logged. */
  needsUpdate: boolean;
};

export const COMMUTE_TABLES = ['routes', 'route_legs', 'fare_rules', 'users'] as const;

// ── Fare rules ─────────────────────────────────────────────────

/** Rules the user may pick: their region only, minus Metro-only modes in Bicol. */
export function listFareRules(region: Region): FareRule[] {
  return db
    .select()
    .from(fareRules)
    .where(eq(fareRules.region, region))
    .orderBy(asc(fareRules.id))
    .all()
    .filter((r) => isModeAllowed(region, r.mode));
}

export function useFareRules(region: Region | undefined) {
  return useDbQuery(() => (region ? listFareRules(region) : []), ['fare_rules'], [region]);
}

export function getFareRule(id: number): FareRule | undefined {
  return db.select().from(fareRules).where(eq(fareRules.id, id)).get();
}

/**
 * Save the user's edit of a fare rule. Only the rule changes: saved routes re-price from it,
 * logged transactions keep the amount actually paid.
 */
export function updateFareRule(id: number, v: FareValues): void {
  db.update(fareRules)
    .set({ ...v, userEdited: true, updatedAt: sql`(datetime('now'))` })
    .where(eq(fareRules.id, id))
    .run();
}

/** Put a rule back to its shipped default (matched by region + mode). Returns false if no default exists. */
export function resetFareRule(id: number): boolean {
  const rule = getFareRule(id);
  const seed = rule && FARE_RULE_SEED.find((s) => s.region === rule.region && s.mode === rule.mode);
  if (!seed) return false;
  const { baseFare, baseKm, perKm, studentPct, promoPct } = seed;
  db.update(fareRules)
    .set({ baseFare, baseKm, perKm, studentPct, promoPct, userEdited: false, updatedAt: sql`(datetime('now'))` })
    .where(eq(fareRules.id, id))
    .run();
  return true;
}

/**
 * Bulk fare update: save several rules at once with a new effective date, and record today
 * as the day fares were checked. Logged transactions keep their amounts.
 */
export function updateFaresBulk(rows: { id: number; values: FareValues }[], effectiveDate: string): void {
  db.transaction((tx) => {
    for (const r of rows) {
      tx.update(fareRules)
        .set({ ...r.values, effectiveDate, userEdited: true, updatedAt: sql`(datetime('now'))` })
        .where(eq(fareRules.id, r.id))
        .run();
    }
  });
  setSetting('fares_checked_on', todayManila());
}

/** "Fares still correct": restart the 90-day reminder without changing any fare. */
export function markFaresChecked(): void {
  setSetting('fares_checked_on', todayManila());
}

/** When fares were last checked (newest effective date or the user's check) and whether a check is due. */
export function getFareCheck(region: Region, today: string = todayManila()) {
  const last = lastChecked(faresLastChecked(region), getSetting('fares_checked_on'));
  return { last, due: fareCheckDue(today, last) };
}

export function useFareCheck(region: Region | undefined) {
  return useDbQuery(() => (region ? getFareCheck(region) : { last: null, due: false }), ['fare_rules', 'app_settings'], [region]);
}

/** Latest effective date among the region's rules — drives "Fares last checked". */
export function faresLastChecked(region: Region): string | null {
  return db.select({ d: max(fareRules.effectiveDate) }).from(fareRules).where(eq(fareRules.region, region)).get()?.d ?? null;
}

// ── Routes ─────────────────────────────────────────────────────

export function listRoutes(region: Region): RouteWithLegs[] {
  const rs = db.select().from(routes).orderBy(desc(routes.isDefault), asc(routes.id)).all();
  if (rs.length === 0) return [];
  const legs = db
    .select({ leg: routeLegs, rule: fareRules })
    .from(routeLegs)
    .innerJoin(fareRules, eq(fareRules.id, routeLegs.fareRuleId))
    .where(inArray(routeLegs.routeId, rs.map((r) => r.id)))
    .orderBy(asc(routeLegs.routeId), asc(routeLegs.seq))
    .all();
  return rs.map((r) => {
    const own = legs.filter((l) => l.leg.routeId === r.id).map((l) => ({ ...l.leg, rule: l.rule }));
    return { ...r, legs: own, needsUpdate: own.some((l) => l.rule.region !== region || !isModeAllowed(region, l.rule.mode)) };
  });
}

export function useRoutes(region: Region | undefined) {
  return useDbQuery(() => (region ? listRoutes(region) : []), COMMUTE_TABLES, [region]);
}

export function getRoute(id: number, region: Region): RouteWithLegs | undefined {
  return listRoutes(region).find((r) => r.id === id);
}

export function totalsFor(route: Pick<RouteWithLegs, 'legs'>, isStudent: boolean) {
  return routeTotals(route.legs.map((l) => ({ rule: l.rule, leg: l })), isStudent);
}

export type LegDraft = LegValues & { fareRuleId: number; fromLabel: string | null; toLabel: string | null };
export type RouteDraft = { id?: number; name: string; minutes: number | null; makeDefault: boolean; legs: LegDraft[] };

/** Insert or update a route and replace its legs, all in one transaction. Returns the route id. */
export function saveRoute(userId: number, draft: RouteDraft): number {
  return db.transaction((tx) => {
    const existing = tx.select({ value: count() }).from(routes).get()?.value ?? 0;
    const makeDefault = draft.makeDefault || existing === 0 || (existing === 1 && draft.id != null);
    let id = draft.id;
    if (id == null) {
      id = tx.insert(routes).values({ userId, name: draft.name, minutes: draft.minutes, isDefault: false }).returning({ id: routes.id }).get().id;
    } else {
      tx.update(routes).set({ name: draft.name, minutes: draft.minutes, updatedAt: sql`(datetime('now'))` }).where(eq(routes.id, id)).run();
      tx.delete(routeLegs).where(eq(routeLegs.routeId, id)).run();
    }
    draft.legs.forEach((l, seq) => {
      tx.insert(routeLegs)
        .values({
          routeId: id!,
          seq,
          fareRuleId: l.fareRuleId,
          fromLabel: l.fromLabel?.trim() || null,
          toLabel: l.toLabel?.trim() || null,
          kmEstimated: l.kmEstimated,
          kmActual: l.kmActual,
          fixedFare: l.fixedFare,
          discountApplies: l.discountApplies,
        })
        .run();
    });
    if (makeDefault) {
      tx.update(routes).set({ isDefault: false }).run();
      tx.update(routes).set({ isDefault: true }).where(eq(routes.id, id)).run();
    }
    return id;
  });
}

export function setDefaultRoute(id: number): void {
  db.transaction((tx) => {
    tx.update(routes).set({ isDefault: false }).run();
    tx.update(routes).set({ isDefault: true }).where(eq(routes.id, id)).run();
  });
}

/**
 * Delete a route. Logged commutes keep their amount; only their link to the route is cleared.
 * If it was the default, the oldest remaining route becomes the default.
 */
export function deleteRoute(id: number): void {
  db.transaction((tx) => {
    tx.update(transactions).set({ routeId: null }).where(eq(transactions.routeId, id)).run();
    tx.delete(routeLegs).where(eq(routeLegs.routeId, id)).run();
    tx.delete(routes).where(eq(routes.id, id)).run();
    const hasDefault = tx.select({ id: routes.id }).from(routes).where(eq(routes.isDefault, true)).get();
    if (!hasDefault) {
      const first = tx.select({ id: routes.id }).from(routes).orderBy(asc(routes.id)).limit(1).get();
      if (first) tx.update(routes).set({ isDefault: true }).where(eq(routes.id, first.id)).run();
    }
  });
}

// ── Commute logging ────────────────────────────────────────────

export function getDefaultRoute(region: Region): RouteWithLegs | undefined {
  return listRoutes(region).find((r) => r.isDefault);
}

/** How many times this route was already logged today (non-deleted). */
export function timesLoggedToday(routeId: number): number {
  return (
    db
      .select({ value: count() })
      .from(transactions)
      .where(and(eq(transactions.routeId, routeId), eq(transactions.date, todayManila()), notDeleted()))
      .get()?.value ?? 0
  );
}

/** Log a commute for today as one Pamasahe expense. Returns the transaction id and the amount saved. */
export function logCommute(routeId: number, trip: 'round' | 'one_way'): { id: number; amount: number } {
  const p = getProfile();
  if (!p) throw new Error('No registered user on this phone');
  const route = getRoute(routeId, p.user.region);
  if (!route) throw new Error('Route not found');
  if (route.needsUpdate) throw new Error('This route uses fares from another region. Edit it first.');
  const totals = totalsFor(route, p.user.isStudent);
  const amount = trip === 'round' ? totals.roundTrip : totals.oneWay;
  const categoryId = getCategoryIdByKey('commute');
  if (categoryId == null) throw new Error('Pamasahe category is missing');
  const id = addTransaction(p.user.id, {
    kind: 'expense',
    amount,
    date: todayManila(),
    categoryId,
    walletId: getDefaultWalletId(),
    routeId,
    tags: [],
    note: `${route.name} · ${trip === 'round' ? 'round trip' : 'one way'}`,
  });
  return { id, amount };
}
