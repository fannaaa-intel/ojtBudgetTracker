/**
 * Grocery list with price memory, and staples (rice, oil, eggs) with a runs-out countdown.
 * "Done shopping" logs ONE Pagkain → Groceries expense for the whole trip.
 */
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { groceryItems } from '@/db/schema';
import { useDbQuery } from '@/db/useDbQuery';
import { todayManila } from '@/lib/dates';
import { essentialStatus, nextDue } from '@/lib/essentials';
import { tripNote, tripTotal } from '@/lib/grocery';
import { addTransaction, getCategoryIdByKey, getDefaultWalletId, softDeleteTransaction } from '../transactions/queries';

export type GroceryItem = typeof groceryItems.$inferSelect;

export function listGrocery(): GroceryItem[] {
  return db.select().from(groceryItems).orderBy(asc(groceryItems.name)).all();
}

export function useGrocery() {
  return useDbQuery(() => {
    const today = todayManila();
    return listGrocery().map((item) => {
      const due = item.isStaple && item.lastsDays ? nextDue(item.lastBought, item.lastsDays) : null;
      return { item, due, status: item.isStaple ? essentialStatus(today, due) : null };
    });
  }, ['grocery_items']);
}

export function getGroceryItem(id: number): GroceryItem | undefined {
  return db.select().from(groceryItems).where(eq(groceryItems.id, id)).get();
}

export type GroceryInput = { name: string; unit: string | null; lastPrice: number | null; isStaple: boolean; lastsDays: number | null; lastBought: string | null };

export function saveGroceryItem(userId: number, id: number | undefined, i: GroceryInput): number {
  const values = { ...i, name: i.name.trim(), unit: i.unit?.trim() || null };
  if (id == null) return db.insert(groceryItems).values({ userId, ...values, onList: true }).returning({ id: groceryItems.id }).get().id;
  db.update(groceryItems).set(values).where(eq(groceryItems.id, id)).run();
  return id;
}

export function deleteGroceryItem(id: number): void {
  db.delete(groceryItems).where(eq(groceryItems.id, id)).run();
}

export function setOnList(id: number, onList: boolean): void {
  db.update(groceryItems).set({ onList, ...(onList ? {} : { inCart: false, cartPrice: null }) }).where(eq(groceryItems.id, id)).run();
}

/** Tick an item into the cart with the price seen in the store (or untick it). */
export function setInCart(id: number, price: number | null): void {
  db.update(groceryItems).set({ inCart: price != null, cartPrice: price }).where(eq(groceryItems.id, id)).run();
}

/**
 * Finish the trip: one expense for the total, then each bought item remembers its price
 * (previous price kept for the "more than last time" note) and leaves the list. Returns undo.
 */
export function finishTrip(userId: number): { total: number; count: number; undo: () => void } | null {
  const bought = listGrocery().filter((i) => i.inCart && i.cartPrice != null);
  const total = tripTotal(bought);
  if (bought.length === 0 || total <= 0) return null;
  const today = todayManila();
  let txId = 0;
  db.transaction((tx) => {
    txId = addTransaction(userId, {
      kind: 'expense',
      amount: total,
      date: today,
      categoryId: getCategoryIdByKey('food_groceries') ?? getCategoryIdByKey('food') ?? null,
      walletId: getDefaultWalletId(),
      tags: [],
      note: tripNote(bought.map((b) => b.name)),
    });
    for (const b of bought) {
      tx.update(groceryItems)
        .set({
          prevPrice: b.lastPrice,
          lastPrice: b.cartPrice,
          updatedAt: today,
          onList: false,
          inCart: false,
          cartPrice: null,
          ...(b.isStaple ? { lastBought: today } : {}),
        })
        .where(eq(groceryItems.id, b.id))
        .run();
    }
  });
  return {
    total,
    count: bought.length,
    undo: () => {
      softDeleteTransaction(txId);
      db.transaction((tx) => {
        for (const b of bought) tx.update(groceryItems).set(b).where(eq(groceryItems.id, b.id)).run();
      });
    },
  };
}
