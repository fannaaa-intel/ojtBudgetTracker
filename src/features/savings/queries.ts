/**
 * Savings goals. "Add to goal" is stored as a transfer (kind = 'transfer'), so it never counts
 * as spending. A goal's saved amount is derived: opening amount + non-deleted transfers into it.
 */
import { and, asc, eq, gte, inArray, lte, min, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { categories, savingsGoals, transactions } from '@/db/schema';
import { useDbQuery } from '@/db/useDbQuery';
import { addDays, todayManila, type ISODate } from '@/lib/dates';
import { daysBetween } from '@/lib/paySchedule';
import { EMERGENCY_DAYS, emergencyTarget, goalPct } from '@/lib/savings';
import { getCategoryIdByKey, getDefaultWalletId, notDeleted, sumAmount } from '../transactions/queries';

export type Goal = typeof savingsGoals.$inferSelect;
export type GoalWithProgress = { goal: Goal; saved: number; pct: number };
export const SAVINGS_TABLES = ['savings_goals', 'transactions'] as const;

function transfersInto(goalId: number): number {
  const row = db
    .select({ total: sql<number>`coalesce(sum(${transactions.amount}), 0)` })
    .from(transactions)
    .where(and(notDeleted(), eq(transactions.kind, 'transfer'), eq(transactions.savingsGoalId, goalId)))
    .get();
  return Number(row?.total ?? 0);
}

export function listGoals(): GoalWithProgress[] {
  return db
    .select()
    .from(savingsGoals)
    .orderBy(sql`${savingsGoals.isEmergencyFund} desc`, asc(savingsGoals.id))
    .all()
    .map((goal) => {
      const saved = goal.saved + transfersInto(goal.id);
      return { goal, saved, pct: goalPct(saved, goal.target) };
    });
}

export function useGoals() {
  return useDbQuery(listGoals, SAVINGS_TABLES);
}

export function getGoal(id: number): Goal | undefined {
  return db.select().from(savingsGoals).where(eq(savingsGoals.id, id)).get();
}

export type GoalInput = { name: string; target: number; opening: number; deadline: ISODate | null; isEmergencyFund: boolean };

export function saveGoal(userId: number, id: number | undefined, i: GoalInput): number {
  const values = { name: i.name.trim(), target: i.target, saved: i.opening, deadline: i.deadline, isEmergencyFund: i.isEmergencyFund };
  if (id == null) return db.insert(savingsGoals).values({ userId, ...values }).returning({ id: savingsGoals.id }).get().id;
  db.update(savingsGoals).set(values).where(eq(savingsGoals.id, id)).run();
  return id;
}

/** Delete a goal. Its transfers stay in history (unlinked). */
export function deleteGoal(id: number): void {
  db.transaction((tx) => {
    tx.update(transactions).set({ savingsGoalId: null }).where(eq(transactions.savingsGoalId, id)).run();
    tx.delete(savingsGoals).where(eq(savingsGoals.id, id)).run();
  });
}

/** Put money into a goal (a transfer, not an expense). Returns the transaction id. */
export function addToGoal(userId: number, goal: Goal, amount: number): number {
  const categoryId = getCategoryIdByKey(goal.isEmergencyFund ? 'savings_emergency' : 'savings_goal') ?? null;
  return db
    .insert(transactions)
    .values({ userId, kind: 'transfer', amount, date: todayManila(), categoryId, walletId: getDefaultWalletId(), savingsGoalId: goal.id, note: goal.name })
    .returning({ id: transactions.id })
    .get().id;
}

/** Last 30 days of "needs" spending and how many days of history that covers. */
export function needsLastMonth(today: ISODate = todayManila()): { spent: number; days: number; suggested: number } {
  const from = addDays(today, -(EMERGENCY_DAYS - 1));
  const needIds = db.select({ id: categories.id }).from(categories).where(eq(categories.bucket, 'needs')).all().map((c) => c.id);
  const spent = sumAmount('expense', from, today, needIds);
  const first = db
    .select({ d: min(transactions.date) })
    .from(transactions)
    .where(and(notDeleted(), eq(transactions.kind, 'expense'), gte(transactions.date, from), lte(transactions.date, today), inArray(transactions.categoryId, needIds)))
    .get()?.d;
  const days = first ? daysBetween(first, today) + 1 : 0;
  return { spent, days, suggested: emergencyTarget(spent, days) };
}

export function useNeedsLastMonth() {
  return useDbQuery(() => needsLastMonth(), ['transactions']);
}
