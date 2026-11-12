/**
 * Ambagan (group contributions) and utang (personal debts). Pure: no React, no DB.
 * Money = integer centavos. Barkada/ambagan are Metro Manila only (see region.ts); utang is for everyone.
 */
import { toCentavos } from './money';
import { computeSplit, type SplitMode } from './split';

export type AmbaganKind = 'gala' | 'party' | 'gift' | 'other';
export const AMBAGAN_KINDS: { kind: AmbaganKind; label: string; categoryKey: string }[] = [
  { kind: 'gala', label: 'Group gala', categoryKey: 'gala_outing' },
  { kind: 'party', label: 'Christmas party', categoryKey: 'gala_events' },
  { kind: 'gift', label: 'Exchange gift', categoryKey: 'gala_events' },
  { kind: 'other', label: 'Other', categoryKey: 'gala' },
];

/**
 * Split an ambagan among members plus me. Members are identified by position (names can repeat
 * across barkadas). Equal: leftover centavo is mine. Custom: my share = total − members' shares.
 */
export function ambaganSplit(
  total: number,
  mode: Exclude<SplitMode, 'none'>,
  memberShares: readonly number[],
): { ok: true; mine: number; members: number[] } | { ok: false; error: string } {
  const r = computeSplit(
    total,
    mode,
    memberShares.map((share, i) => ({ roommateId: i, share })),
  );
  if (!r.ok) return { ok: false, error: r.error.replace('Roommates’', 'Members’') };
  return { ok: true, mine: r.split.mine, members: r.split.shares.map((s) => s.amount) };
}

export type Debt = { amount: number; direction: 'owed_to_me' | 'i_owe'; settledAt: string | null };

export function utangTotals(debts: readonly Debt[]): { owedToMe: number; iOwe: number; net: number } {
  let owedToMe = 0;
  let iOwe = 0;
  for (const d of debts) {
    if (d.settledAt) continue;
    if (d.direction === 'owed_to_me') owedToMe += d.amount;
    else iOwe += d.amount;
  }
  return { owedToMe, iOwe, net: owedToMe - iOwe };
}

export type DebtDraft = { person: string; amountText: string };
export function validateDebt(d: DebtDraft): { ok: true; amount: number } | { ok: false; errors: Partial<Record<'person' | 'amount', string>> } {
  const errors: Partial<Record<'person' | 'amount', string>> = {};
  const amount = toCentavos(d.amountText);
  if (!d.person.trim()) errors.person = 'Who is it with?';
  if (amount == null || amount <= 0) errors.amount = 'Enter an amount';
  return Object.keys(errors).length || amount == null ? { ok: false, errors } : { ok: true, amount };
}
