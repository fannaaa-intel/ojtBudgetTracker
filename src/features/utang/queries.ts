/**
 * Utang: personal debts, for every intern (not a group feature). Tracker only — settling a debt
 * does not log an expense, so money is never counted twice.
 */
import { asc, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { debts } from '@/db/schema';
import { useDbQuery } from '@/db/useDbQuery';
import { todayManila } from '@/lib/dates';

export type DebtRow = typeof debts.$inferSelect;
export type DebtInput = { person: string; amount: number; direction: 'owed_to_me' | 'i_owe'; note: string | null };

export function listDebts(): DebtRow[] {
  return db.select().from(debts).orderBy(sql`${debts.settledAt} is not null`, desc(debts.createdAt), asc(debts.id)).all();
}

export function useDebts() {
  return useDbQuery(listDebts, ['debts']);
}

export function getDebt(id: number): DebtRow | undefined {
  return db.select().from(debts).where(eq(debts.id, id)).get();
}

export function saveDebt(userId: number, id: number | undefined, i: DebtInput): number {
  const values = { person: i.person.trim(), amount: i.amount, direction: i.direction, note: i.note?.trim() || null };
  if (id == null) return db.insert(debts).values({ userId, ...values }).returning({ id: debts.id }).get().id;
  db.update(debts).set({ ...values, updatedAt: sql`(datetime('now'))` }).where(eq(debts.id, id)).run();
  return id;
}

export function setSettled(id: number, settled: boolean): void {
  db.update(debts).set({ settledAt: settled ? todayManila() : null }).where(eq(debts.id, id)).run();
}

export function deleteDebt(id: number): void {
  db.delete(debts).where(eq(debts.id, id)).run();
}
