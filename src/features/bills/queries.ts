/**
 * Recurring bills and monthly payments. Paying a bill logs an expense for the amount actually
 * paid (stored on the transaction, so later edits to the bill never change history).
 */
import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { billPayments, categories, recurringBills } from '@/db/schema';
import { useDbQuery } from '@/db/useDbQuery';
import { billPeriod, billStatus, dueDateFor, type BillStatus } from '@/lib/bills';
import { todayManila, type ISODate } from '@/lib/dates';
import { addTransaction, getCategoryIdByKey, getDefaultWalletId, restoreTransaction, softDeleteTransaction } from '../transactions/queries';

export type Bill = typeof recurringBills.$inferSelect;
export type BillPayment = typeof billPayments.$inferSelect;
export type BillInput = { name: string; categoryId: number | null; amount: number; dueDay: number; isVariable: boolean };

export const BILL_TABLES = ['recurring_bills', 'bill_payments', 'categories', 'transactions'] as const;

export function getBill(id: number): Bill | undefined {
  return db.select().from(recurringBills).where(eq(recurringBills.id, id)).get();
}

export function saveBill(userId: number, id: number | undefined, input: BillInput): number {
  const values = { ...input, name: input.name.trim() };
  if (id == null) return db.insert(recurringBills).values({ userId, ...values }).returning({ id: recurringBills.id }).get().id;
  db.update(recurringBills).set(values).where(eq(recurringBills.id, id)).run();
  return id;
}

/** Delete a bill and its payment records. Expenses already logged stay in history. */
export function deleteBill(id: number): void {
  db.transaction((tx) => {
    tx.delete(billPayments).where(eq(billPayments.billId, id)).run();
    tx.delete(recurringBills).where(eq(recurringBills.id, id)).run();
  });
}

export type BillThisMonth = {
  bill: Bill;
  categoryKey: string | null;
  period: string;
  dueDate: ISODate;
  payment: BillPayment | undefined;
  status: BillStatus;
};

export function listBillsThisMonth(today: ISODate = todayManila()): BillThisMonth[] {
  const period = billPeriod(today);
  const rows = db
    .select({ bill: recurringBills, key: categories.key })
    .from(recurringBills)
    .leftJoin(categories, eq(categories.id, recurringBills.categoryId))
    .orderBy(asc(recurringBills.dueDay), asc(recurringBills.id))
    .all();
  const payments = db.select().from(billPayments).where(eq(billPayments.period, period)).all();
  return rows
    .map(({ bill, key }) => {
      const payment = payments.find((p) => p.billId === bill.id);
      const dueDate = dueDateFor(period, bill.dueDay);
      return { bill, categoryKey: key ?? null, period, dueDate, payment, status: billStatus(today, dueDate, !!payment) };
    })
    .sort((a, b) => (a.status === 'paid' ? 1 : 0) - (b.status === 'paid' ? 1 : 0) || a.dueDate.localeCompare(b.dueDate));
}

export function useBillsThisMonth() {
  return useDbQuery(() => listBillsThisMonth(), BILL_TABLES);
}

/**
 * Mark a bill paid for a period. The payment row keeps the full bill total (so roommate shares
 * can be worked out later); the expense keeps what the intern actually paid (whole bill or own share).
 */
export function markBillPaid(
  userId: number,
  bill: Bill,
  period: string,
  amounts: { billTotal: number; paid: number },
  note?: string,
): { paymentId: number; transactionId: number } {
  const amount = amounts.billTotal;
  const categoryId = bill.categoryId ?? getCategoryIdByKey('bills') ?? null;
  const transactionId = addTransaction(userId, {
    kind: 'expense',
    amount: amounts.paid,
    date: todayManila(),
    categoryId,
    walletId: getDefaultWalletId(),
    tags: [],
    note: note ?? `${bill.name} · ${period}`,
  });
  const paymentId = db
    .insert(billPayments)
    .values({ billId: bill.id, period, amount, paidAt: todayManila(), transactionId })
    .returning({ id: billPayments.id })
    .get().id;
  return { paymentId, transactionId };
}

/** Undo "paid": remove the payment row and soft-delete its expense. */
export function unmarkBillPaid(paymentId: number): void {
  const p = db.select().from(billPayments).where(eq(billPayments.id, paymentId)).get();
  if (!p) return;
  db.delete(billPayments).where(eq(billPayments.id, paymentId)).run();
  if (p.transactionId != null) softDeleteTransaction(p.transactionId);
}

/** Put an undone payment back exactly (Undo of "unpaid"). */
export function remarkBillPaid(p: BillPayment): void {
  db.insert(billPayments).values(p).run();
  if (p.transactionId != null) restoreTransaction(p.transactionId);
}

export function getPayment(billId: number, period: string): BillPayment | undefined {
  return db.select().from(billPayments).where(and(eq(billPayments.billId, billId), eq(billPayments.period, period))).get();
}
