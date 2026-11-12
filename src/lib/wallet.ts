/**
 * Wallet balances, the Beep card, and route comparison. Pure: no React, no DB. Money = centavos.
 */
import { METRO_ONLY_MODES } from './region';

/** opening + income in + transfers in − expenses out − transfers out. */
export function walletBalanceOf(f: { opening: number; incomeIn: number; transfersIn: number; expensesOut: number; transfersOut: number }): number {
  return f.opening + f.incomeIn + f.transfersIn - f.expensesOut - f.transfersOut;
}

/** Fare modes paid with a Beep card (Metro Manila trains and the EDSA Carousel). */
export function isBeepMode(mode: string): boolean {
  return (METRO_ONLY_MODES as readonly string[]).includes(mode);
}

/** Low when the card cannot cover two more round trips of its Beep legs. */
export function beepLow(balance: number, beepRoundTrip: number): boolean {
  if (beepRoundTrip <= 0) return balance <= 0;
  return balance < beepRoundTrip * 2;
}

/** Split one-way leg fares into Beep legs and cash legs. */
export function splitByBeep(legs: readonly { mode: string; payable: number }[]): { beep: number; cash: number } {
  return legs.reduce((acc, l) => (isBeepMode(l.mode) ? { ...acc, beep: acc.beep + l.payable } : { ...acc, cash: acc.cash + l.payable }), { beep: 0, cash: 0 });
}

export type RouteForCompare = { id: number; name: string; cost: number; minutes: number | null };

/** Sorted cheapest first; marks the cheapest and the fastest (routes without minutes are never fastest). */
export function compareRoutes(routes: readonly RouteForCompare[]) {
  const sorted = [...routes].sort((a, b) => a.cost - b.cost || (a.minutes ?? 1e9) - (b.minutes ?? 1e9));
  const cheapest = sorted[0];
  const timed = routes.filter((r) => r.minutes != null);
  const fastest = timed.length ? timed.reduce((best, r) => (r.minutes! < best.minutes! || (r.minutes === best.minutes && r.cost < best.cost) ? r : best)) : undefined;
  return sorted.map((r) => ({
    ...r,
    cheapest: r.id === cheapest?.id,
    fastest: r.id === fastest?.id,
    extraCost: cheapest ? r.cost - cheapest.cost : 0,
    extraMinutes: fastest && r.minutes != null ? r.minutes - fastest.minutes! : null,
  }));
}
