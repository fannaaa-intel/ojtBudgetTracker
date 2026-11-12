/**
 * Transaction form rules. Pure: no React, no DB. Money is integer centavos.
 */
import { isValidISO } from './dates';
import { toCentavos } from './money';

export type TxKind = 'expense' | 'income';

/** ₱1,000,000.00 — anything larger is almost certainly a typo. */
export const MAX_AMOUNT = 100_000_000;

export type TxDraft = {
  kind: TxKind;
  amountText: string;
  date: string;
  categoryId: number | null;
  walletId: number | null;
};

export type TxErrors = Partial<Record<'amount' | 'date' | 'category' | 'wallet', string>>;

export type TxValidation = { ok: true; amount: number } | { ok: false; errors: TxErrors };

export function validateTxDraft(d: TxDraft): TxValidation {
  const errors: TxErrors = {};
  const amount = toCentavos(d.amountText);
  if (amount == null) errors.amount = 'Enter an amount, e.g. 85 or 85.50';
  else if (amount <= 0) errors.amount = 'Amount must be more than ₱0';
  else if (amount > MAX_AMOUNT) errors.amount = 'That amount looks too large';
  if (!isValidISO(d.date)) errors.date = 'Choose a date';
  if (d.kind === 'expense' && d.categoryId == null) errors.category = 'Choose a category';
  if (d.walletId == null) errors.wallet = 'Choose a wallet';
  return Object.keys(errors).length || amount == null ? { ok: false, errors } : { ok: true, amount };
}

/** Centavos → text for the amount field: 8550 → "85.50", 8000 → "80". */
export function amountToInput(centavos: number): string {
  const pesos = Math.floor(centavos / 100);
  const cents = centavos % 100;
  return cents === 0 ? String(pesos) : `${pesos}.${cents.toString().padStart(2, '0')}`;
}

/**
 * Current wallet balance. wallets.balance is the opening balance; the rest is derived
 * from non-deleted transactions so edits and deletes can never make it drift.
 */
export function walletBalance(opening: number, incomeTotal: number, expenseTotal: number): number {
  return opening + incomeTotal - expenseTotal;
}
