/**
 * Wallet balances (derived, never stored as a running total) and the Beep card.
 * A Beep top-up is a transfer Cash → Beep, so it never counts as spending.
 * Beep is Metro Manila only (trains + EDSA Carousel), like the train fares themselves.
 */
import { and, asc, desc, eq, or, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { transactions, wallets, type Region } from '@/db/schema';
import { useDbQuery } from '@/db/useDbQuery';
import { todayManila } from '@/lib/dates';
import { legFare } from '@/lib/route';
import { featuresFor } from '@/lib/region';
import { beepLow, isBeepMode, walletBalanceOf } from '@/lib/wallet';
import { getDefaultRoute } from '../commute/queries';
import { getProfile } from '../profile/queries';
import { getDefaultWalletId, notDeleted } from '../transactions/queries';

export type Wallet = typeof wallets.$inferSelect;

function sumWhere(cond: ReturnType<typeof and>): number {
  const r = db.select({ t: sql<number>`coalesce(sum(${transactions.amount}), 0)` }).from(transactions).where(and(notDeleted(), cond)).get();
  return Number(r?.t ?? 0);
}

export function walletBalance(w: Wallet): number {
  return walletBalanceOf({
    opening: w.balance,
    incomeIn: sumWhere(and(eq(transactions.kind, 'income'), eq(transactions.walletId, w.id))),
    transfersIn: sumWhere(and(eq(transactions.kind, 'transfer'), eq(transactions.toWalletId, w.id))),
    expensesOut: sumWhere(and(eq(transactions.kind, 'expense'), eq(transactions.walletId, w.id))),
    transfersOut: sumWhere(and(eq(transactions.kind, 'transfer'), eq(transactions.walletId, w.id))),
  });
}

export function getBeep(): Wallet | undefined {
  return db.select().from(wallets).where(eq(wallets.type, 'beep')).orderBy(asc(wallets.id)).limit(1).get();
}

export function createBeep(userId: number, opening: number): number {
  return db.insert(wallets).values({ userId, name: 'Beep card', type: 'beep', balance: opening }).returning({ id: wallets.id }).get().id;
}

/** Correct the card's balance: stores a new opening so the derived balance equals `actual`. */
export function setBeepBalance(w: Wallet, actual: number): void {
  const current = walletBalance(w);
  db.update(wallets).set({ balance: w.balance + (actual - current) }).where(eq(wallets.id, w.id)).run();
}

/** Top up the Beep card from Cash. Returns the transaction id (for Undo). */
export function topUpBeep(userId: number, beep: Wallet, amount: number): number {
  return db
    .insert(transactions)
    .values({ userId, kind: 'transfer', amount, date: todayManila(), walletId: getDefaultWalletId(), toWalletId: beep.id, note: 'Beep top-up' })
    .returning({ id: transactions.id })
    .get().id;
}

/** Beep fare of the daily route, round trip (0 if the route has no train/Carousel legs). */
export function beepRoundTrip(region: Region, isStudent: boolean): number {
  const route = getDefaultRoute(region);
  if (!route || route.needsUpdate) return 0;
  const oneWay = route.legs.filter((l) => isBeepMode(l.rule.mode)).reduce((s, l) => s + legFare(l.rule, l, isStudent).payable, 0);
  return oneWay * 2;
}

export function getBeepState() {
  const p = getProfile();
  if (!p || !featuresFor(p.user.region).trains) return undefined;
  const beep = getBeep();
  if (!beep) return { beep: undefined, balance: 0, roundTrip: beepRoundTrip(p.user.region, p.user.isStudent), low: false };
  const balance = walletBalance(beep);
  const roundTrip = beepRoundTrip(p.user.region, p.user.isStudent);
  return { beep, balance, roundTrip, low: beepLow(balance, roundTrip) };
}

export function useBeepState() {
  return useDbQuery(getBeepState, ['wallets', 'transactions', 'routes', 'route_legs', 'fare_rules', 'users']);
}

export function beepHistory(beepId: number) {
  return db
    .select()
    .from(transactions)
    .where(and(notDeleted(), or(eq(transactions.walletId, beepId), eq(transactions.toWalletId, beepId))))
    .orderBy(desc(transactions.date), desc(transactions.id))
    .limit(50)
    .all();
}

export function useBeepHistory(beepId: number | undefined) {
  return useDbQuery(() => (beepId ? beepHistory(beepId) : []), ['transactions'], [beepId]);
}
