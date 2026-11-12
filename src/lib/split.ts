/**
 * Roommate bill split. Pure: no React, no DB. Money = integer centavos.
 *   equal  → total ÷ (roommates + me); any leftover centavo goes to me (the one who pays the bill)
 *   custom → each roommate has a fixed share; my share = total − their shares
 */
import { splitEvenly } from './money';

export type SplitMode = 'none' | 'equal' | 'custom';
export type SplitResult = { mine: number; shares: { roommateId: number; amount: number }[] };

export function computeSplit(
  total: number,
  mode: SplitMode,
  roommates: readonly { roommateId: number; share: number }[],
): { ok: true; split: SplitResult } | { ok: false; error: string } {
  if (mode === 'none' || roommates.length === 0) return { ok: true, split: { mine: total, shares: [] } };
  if (mode === 'equal') {
    const parts = splitEvenly(total, roommates.length + 1); // first part (with the remainder) is mine
    return { ok: true, split: { mine: parts[0], shares: roommates.map((r, i) => ({ roommateId: r.roommateId, amount: parts[i + 1] })) } };
  }
  const theirs = roommates.reduce((s, r) => s + r.share, 0);
  if (roommates.some((r) => r.share < 0)) return { ok: false, error: 'Shares cannot be negative' };
  if (theirs > total) return { ok: false, error: 'Roommates’ shares are more than the bill' };
  return { ok: true, split: { mine: total - theirs, shares: roommates.map((r) => ({ roommateId: r.roommateId, amount: r.share })) } };
}

/** Bills can be split only when the intern rents or lives in a dorm. */
export function splitAvailable(livingSetup: 'home' | 'renting' | 'dorm'): boolean {
  return livingSetup !== 'home';
}
