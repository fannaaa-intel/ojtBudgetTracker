import { asc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { restockItems } from '@/db/schema';
import { useDbQuery } from '@/db/useDbQuery';
import { todayManila, type ISODate } from '@/lib/dates';
import { ESSENTIAL_KINDS, essentialStatus, nextDue, type EssentialKind, type EssentialStatus } from '@/lib/essentials';
import { addTransaction, getCategoryIdByKey, getDefaultWalletId, softDeleteTransaction } from '../transactions/queries';

export type Essential = typeof restockItems.$inferSelect;
export type EssentialWithStatus = { item: Essential; due: ISODate | null; status: EssentialStatus };

const ORDER: Record<EssentialStatus, number> = { overdue: 0, due_soon: 1, never: 2, ok: 3 };

export function listEssentials(today: ISODate = todayManila()): EssentialWithStatus[] {
  return db
    .select()
    .from(restockItems)
    .orderBy(asc(restockItems.id))
    .all()
    .map((item) => {
      const due = nextDue(item.lastBought, item.lastsDays);
      return { item, due, status: essentialStatus(today, due) };
    })
    .sort((a, b) => ORDER[a.status] - ORDER[b.status] || (a.due ?? '').localeCompare(b.due ?? ''));
}

export function useEssentials() {
  return useDbQuery(() => listEssentials(), ['restock_items']);
}

export function getEssential(id: number): Essential | undefined {
  return db.select().from(restockItems).where(eq(restockItems.id, id)).get();
}

export type EssentialInput = { name: string; kind: EssentialKind; lastsDays: number; typicalPrice: number | null; lastBought: ISODate | null };

export function saveEssential(userId: number, id: number | undefined, input: EssentialInput): number {
  const categoryKey = ESSENTIAL_KINDS.find((k) => k.kind === input.kind)?.categoryKey ?? 'essentials';
  const values = { ...input, name: input.name.trim(), categoryId: getCategoryIdByKey(categoryKey) ?? null };
  if (id == null) return db.insert(restockItems).values({ userId, ...values }).returning({ id: restockItems.id }).get().id;
  db.update(restockItems).set(values).where(eq(restockItems.id, id)).run();
  return id;
}

export function deleteEssential(id: number): void {
  db.delete(restockItems).where(eq(restockItems.id, id)).run();
}

/** "Bought": logs the expense (amount actually paid) and restarts the cycle from today. */
export function markBought(userId: number, item: Essential, amount: number): { undo: () => void } {
  const today = todayManila();
  const prev = { lastBought: item.lastBought, typicalPrice: item.typicalPrice };
  const txId = addTransaction(userId, {
    kind: 'expense',
    amount,
    date: today,
    categoryId: item.categoryId ?? getCategoryIdByKey('essentials') ?? null,
    walletId: getDefaultWalletId(),
    tags: [],
    note: item.name,
  });
  db.update(restockItems).set({ lastBought: today, typicalPrice: amount }).where(eq(restockItems.id, item.id)).run();
  return {
    undo: () => {
      softDeleteTransaction(txId);
      db.update(restockItems).set(prev).where(eq(restockItems.id, item.id)).run();
    },
  };
}
