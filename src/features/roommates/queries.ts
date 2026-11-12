import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { billSharePayments, billShares, ojtProfile, recurringBills, roommates } from '@/db/schema';
import { useDbQuery } from '@/db/useDbQuery';
import type { SplitMode } from '@/lib/split';

export type Roommate = typeof roommates.$inferSelect;
export const ROOMMATE_TABLES = ['roommates', 'bill_shares', 'bill_share_payments', 'recurring_bills', 'ojt_profile'] as const;

export function listRoommates(): Roommate[] {
  return db.select().from(roommates).orderBy(asc(roommates.id)).all();
}

export function useRoommates() {
  return useDbQuery(listRoommates, ['roommates']);
}

export function addRoommate(userId: number, name: string): number {
  return db.insert(roommates).values({ userId, name: name.trim() }).returning({ id: roommates.id }).get().id;
}

/** Removes the roommate and their shares / paid ticks (cascade). Logged expenses are untouched. */
export function deleteRoommate(id: number): void {
  db.delete(roommates).where(eq(roommates.id, id)).run();
}

export function updateLivingSetup(userId: number, livingSetup: 'home' | 'renting' | 'dorm'): void {
  db.update(ojtProfile).set({ livingSetup }).where(eq(ojtProfile.userId, userId)).run();
}

export type BillShare = { roommateId: number; name: string; share: number };

export function getBillShares(billId: number): BillShare[] {
  return db
    .select({ roommateId: billShares.roommateId, name: roommates.name, share: billShares.share })
    .from(billShares)
    .innerJoin(roommates, eq(roommates.id, billShares.roommateId))
    .where(eq(billShares.billId, billId))
    .orderBy(asc(roommates.id))
    .all();
}

/** Replace a bill's split (mode + who is in it + custom amounts) in one transaction. */
export function setBillSplit(billId: number, mode: SplitMode, shares: { roommateId: number; share: number }[]): void {
  db.transaction((tx) => {
    tx.update(recurringBills).set({ splitMode: shares.length === 0 ? 'none' : mode }).where(eq(recurringBills.id, billId)).run();
    tx.delete(billShares).where(eq(billShares.billId, billId)).run();
    if (mode !== 'none') {
      for (const s of shares) tx.insert(billShares).values({ billId, roommateId: s.roommateId, share: mode === 'custom' ? s.share : 0 }).run();
    }
  });
}

export function paidRoommates(billId: number, period: string): Set<number> {
  return new Set(
    db
      .select({ id: billSharePayments.roommateId })
      .from(billSharePayments)
      .where(and(eq(billSharePayments.billId, billId), eq(billSharePayments.period, period)))
      .all()
      .map((r) => r.id),
  );
}

export function setSharePaid(billId: number, roommateId: number, period: string, paid: boolean, today: string): void {
  if (paid) {
    db.insert(billSharePayments).values({ billId, roommateId, period, paidAt: today }).onConflictDoNothing().run();
  } else {
    db.delete(billSharePayments)
      .where(and(eq(billSharePayments.billId, billId), eq(billSharePayments.roommateId, roommateId), eq(billSharePayments.period, period)))
      .run();
  }
}

export function useBillSplit(billId: number | undefined, period: string) {
  return useDbQuery(
    () => (billId == null ? { shares: [] as BillShare[], paid: new Set<number>() } : { shares: getBillShares(billId), paid: paidRoommates(billId, period) }),
    ROOMMATE_TABLES,
    [billId, period],
  );
}
