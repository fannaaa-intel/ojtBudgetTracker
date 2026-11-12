/**
 * Gala planner. Pure: no React, no DB. Money = integer centavos.
 * The gala allowance is the weekly Gala budget envelope; a planned outing is checked against
 * what is left of it and logged as one Gala → Outings expense.
 */
import { budgetStatus, type BudgetStatus } from './budget';

export type GalaPart = { label: string; amount: number };

export function galaTotal(parts: readonly GalaPart[]): number {
  return parts.reduce((s, p) => s + Math.max(0, p.amount), 0);
}

/** "SM North · Fare ₱60.00 · Food ₱150.00 · Activity ₱300.00" (zero parts left out). */
export function galaNote(place: string, parts: readonly GalaPart[], format: (c: number) => string): string {
  const bits = parts.filter((p) => p.amount > 0).map((p) => `${p.label} ${format(p.amount)}`);
  return [place.trim() || 'Gala', ...bits].join(' · ');
}

export type GalaCheck = { leftAfter: number; status: BudgetStatus } | null;

/** How the plan sits against this week's gala allowance (null when there is no allowance). */
export function checkAgainstAllowance(total: number, allowance: { available: number; spent: number } | null): GalaCheck {
  if (!allowance) return null;
  const after = allowance.spent + total;
  return { leftAfter: allowance.available - after, status: budgetStatus(after, allowance.available) };
}
