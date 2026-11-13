/**
 * Savings goals and the emergency fund. Pure: no React, no DB. Money = integer centavos.
 * A goal's saved amount = its opening amount + every non-deleted transfer into it,
 * so editing or deleting a transfer can never make the total drift.
 */
import { isValidISO, type ISODate } from './dates';
import { toCentavos } from './money';
import { daysBetween } from './paySchedule';

export const EMERGENCY_DAYS = 30;

/**
 * Saved = opening amount + money put in − money taken out (both are transfers, never spending).
 * Never below 0, even if old data is inconsistent.
 */
export function goalSaved(opening: number, putIn: number, takenOut: number): number {
  return Math.max(0, opening + putIn - takenOut);
}

/** Error text for a withdrawal, or null when it's allowed (more than ₱0, at most what's saved). */
export function withdrawalError(amount: number, saved: number): string | null {
  if (!Number.isInteger(amount) || amount <= 0) return 'Enter an amount more than ₱0';
  if (amount > saved) return 'That is more than this goal has';
  return null;
}

export function goalPct(saved: number, target: number): number {
  if (target <= 0) return saved > 0 ? 100 : 0;
  return Math.min(100, Math.round((saved * 100) / target));
}

/**
 * Default emergency fund target = 1 month of necessities: the last 30 days of "needs" spending,
 * scaled up to 30 days when there is less history (e.g. 10 days of data × 3). 0 with no data.
 */
export function emergencyTarget(needsSpent: number, daysOfData: number): number {
  if (daysOfData <= 0 || needsSpent <= 0) return 0;
  const days = Math.min(EMERGENCY_DAYS, daysOfData);
  return Math.round((needsSpent * EMERGENCY_DAYS) / days);
}

/** How much to set aside each week to reach the target by the deadline (null without a deadline). */
export function weeklyToReach(saved: number, target: number, today: ISODate, deadline: ISODate | null): number | null {
  if (!deadline) return null;
  const left = Math.max(0, target - saved);
  if (left === 0) return 0;
  const days = daysBetween(today, deadline);
  if (days <= 0) return left;
  return Math.ceil(left / Math.max(1, Math.ceil(days / 7)));
}

export type GoalDraft = { name: string; targetText: string; openingText: string; deadline: string | null };
export type GoalErrors = Partial<Record<'name' | 'target' | 'opening' | 'deadline', string>>;

export function validateGoal(d: GoalDraft): { ok: true; target: number; opening: number } | { ok: false; errors: GoalErrors } {
  const errors: GoalErrors = {};
  const target = toCentavos(d.targetText);
  const opening = d.openingText.trim() === '' ? 0 : toCentavos(d.openingText);
  if (!d.name.trim()) errors.name = 'Name the goal';
  if (target == null || target <= 0) errors.target = 'Enter a target amount';
  if (opening == null || opening < 0) errors.opening = 'Enter an amount or leave blank';
  if (d.deadline != null && !isValidISO(d.deadline)) errors.deadline = 'Choose a date';
  return Object.keys(errors).length || target == null || opening == null ? { ok: false, errors } : { ok: true, target, opening };
}
