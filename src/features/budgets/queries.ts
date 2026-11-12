/**
 * Budget envelopes: per parent category (or overall), weekly or monthly, optional rollover.
 * A parent envelope counts spending in all its child categories. Soft-deleted rows never count.
 */
import { and, asc, eq, isNull } from 'drizzle-orm';
import { db } from '@/db/client';
import { budgets, categories } from '@/db/schema';
import { useDbQuery } from '@/db/useDbQuery';
import {
  budgetStatus,
  periodRange,
  previousPeriodRange,
  progressPct,
  rolloverCarry,
  safeToSpendToday,
  type BudgetPeriod,
  type BudgetStatus,
  type DateRange,
  type SafeToSpend,
} from '@/lib/budget';
import { addDays, todayManila, type ISODate } from '@/lib/dates';
import { categoryFamilyIds, sumAmount } from '../transactions/queries';

export type BudgetRow = typeof budgets.$inferSelect;
export type BudgetInput = { categoryId: number | null; period: BudgetPeriod; limitAmount: number; rollover: boolean };

export const BUDGET_TABLES = ['budgets', 'transactions', 'categories'] as const;

export function getBudget(id: number): BudgetRow | undefined {
  return db.select().from(budgets).where(eq(budgets.id, id)).get();
}

/** Another budget for the same category + period, if any (one envelope each). */
export function findDuplicateBudget(input: Pick<BudgetInput, 'categoryId' | 'period'>, exceptId?: number): BudgetRow | undefined {
  return db
    .select()
    .from(budgets)
    .where(and(input.categoryId == null ? isNull(budgets.categoryId) : eq(budgets.categoryId, input.categoryId), eq(budgets.period, input.period)))
    .all()
    .find((b) => b.id !== exceptId);
}

export function saveBudget(userId: number, id: number | undefined, input: BudgetInput): number {
  if (id == null) return db.insert(budgets).values({ userId, ...input }).returning({ id: budgets.id }).get().id;
  db.update(budgets).set(input).where(eq(budgets.id, id)).run();
  return id;
}

export function deleteBudget(id: number): void {
  db.delete(budgets).where(eq(budgets.id, id)).run();
}

// ── Progress ───────────────────────────────────────────────────

export type BudgetProgress = {
  budget: BudgetRow;
  name: string;
  categoryKey: string | null;
  range: DateRange;
  carry: number;
  available: number;
  spent: number;
  left: number;
  status: BudgetStatus;
  pct: number;
};

function spendIn(range: DateRange, categoryIds: number[] | undefined): number {
  return sumAmount('expense', range.from, range.to, categoryIds);
}

export function listBudgetProgress(today: ISODate = todayManila()): BudgetProgress[] {
  const rows = db
    .select({ budget: budgets, name: categories.name, key: categories.key, sort: categories.sort })
    .from(budgets)
    .leftJoin(categories, eq(categories.id, budgets.categoryId))
    .orderBy(asc(budgets.period), asc(categories.sort), asc(budgets.id))
    .all();

  return rows.map(({ budget, name, key }) => {
    const ids = budget.categoryId == null ? undefined : categoryFamilyIds(budget.categoryId);
    const range = periodRange(budget.period === 'monthly' ? 'monthly' : 'weekly', today);
    const prev = previousPeriodRange(budget.period === 'monthly' ? 'monthly' : 'weekly', today);
    const carry = rolloverCarry(budget.rollover, budget.limitAmount, spendIn(prev, ids));
    const available = budget.limitAmount + carry;
    const spent = spendIn(range, ids);
    return {
      budget,
      name: name ?? 'All spending',
      categoryKey: key ?? null,
      range,
      carry,
      available,
      spent,
      left: available - spent,
      status: budgetStatus(spent, available),
      pct: progressPct(spent, available),
    };
  });
}

export function useBudgetProgress() {
  return useDbQuery(() => listBudgetProgress(), BUDGET_TABLES);
}

/**
 * Safe to spend today. Uses weekly budgets when any exist, otherwise monthly ones.
 * Within that period: the overall ("All spending") budget if there is one, otherwise the
 * sum of the category envelopes. undefined = no budget at all yet.
 */
export function getSafeToSpend(today: ISODate = todayManila()): (SafeToSpend & { available: number }) | undefined {
  const all = listBudgetProgress(today);
  const weekly = all.filter((p) => p.budget.period === 'weekly');
  const period: BudgetPeriod = weekly.length > 0 ? 'weekly' : 'monthly';
  const inPeriod = weekly.length > 0 ? weekly : all.filter((p) => p.budget.period === 'monthly');
  if (inPeriod.length === 0) return undefined;
  const overall = inPeriod.find((p) => p.budget.categoryId == null);
  const envelopes = overall ? [overall] : inPeriod;
  const available = envelopes.reduce((s, p) => s + p.available, 0);
  const ids = overall ? undefined : envelopes.flatMap((p) => categoryFamilyIds(p.budget.categoryId!));
  const start = envelopes[0].range.from;
  const spentBefore = today > start ? spendIn({ from: start, to: addDays(today, -1) }, ids) : 0;
  const spentToday = spendIn({ from: today, to: today }, ids);
  return { ...safeToSpendToday(available, spentBefore, spentToday, today, period), available };
}

export function useSafeToSpend() {
  return useDbQuery(() => getSafeToSpend(), BUDGET_TABLES);
}
