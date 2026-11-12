/**
 * Transaction reads/writes. Synchronous (expo-sqlite). Every read that feeds a total
 * goes through notDeleted() — soft-deleted rows never count.
 */
import { and, asc, desc, eq, gte, inArray, isNull, lte, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import { db } from '@/db/client';
import { categories, incomeSources, transactions, wallets } from '@/db/schema';
import { parseTags, serializeTags } from '@/lib/tags';
import type { TxKind } from '@/lib/transactions';

export type TxInput = {
  kind: TxKind;
  amount: number; // centavos, > 0 (₱0 only for a baon preset)
  date: string; // YYYY-MM-DD
  categoryId: number | null;
  walletId: number | null;
  routeId?: number | null;
  /** Income only: which allowance / pay source this came from. */
  incomeSourceId?: number | null;
  /** One-time purchase (OJT requirements etc.): counted in totals, left out of daily averages. */
  isOneTime?: boolean;
  tags: string[];
  note: string | null;
};

export const notDeleted = (): SQL => isNull(transactions.deletedAt);

function toRow(i: TxInput) {
  return {
    kind: i.kind,
    amount: i.amount,
    date: i.date,
    categoryId: i.kind === 'income' ? null : i.categoryId,
    walletId: i.walletId,
    routeId: i.routeId ?? null,
    incomeSourceId: i.kind === 'income' ? (i.incomeSourceId ?? null) : null,
    isOneTime: i.kind === 'expense' ? (i.isOneTime ?? false) : false,
    tags: serializeTags(i.tags),
    note: i.note?.trim() || null,
  };
}

export function addTransaction(userId: number, input: TxInput): number {
  return db.insert(transactions).values({ userId, ...toRow(input) }).returning({ id: transactions.id }).get().id;
}

export function updateTransaction(id: number, input: TxInput): void {
  db.update(transactions)
    .set({ ...toRow(input), updatedAt: sql`(datetime('now'))` })
    .where(eq(transactions.id, id))
    .run();
}

export function softDeleteTransaction(id: number): void {
  db.update(transactions).set({ deletedAt: sql`(datetime('now'))` }).where(eq(transactions.id, id)).run();
}

export function restoreTransaction(id: number): void {
  db.update(transactions).set({ deletedAt: null }).where(eq(transactions.id, id)).run();
}

/** A live transfer (money into savings) — shown read-only, never edited as an expense. */
export function getTransfer(id: number) {
  return db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.kind, 'transfer'), notDeleted()))
    .get();
}

/** One live (non-deleted) expense or income as form input, or undefined (transfers excluded). */
export function getTransactionInput(id: number): TxInput | undefined {
  const r = db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, id), notDeleted()))
    .get();
  if (!r || r.kind === 'transfer') return undefined;
  return {
    kind: r.kind === 'income' ? 'income' : 'expense',
    amount: r.amount,
    date: r.date,
    categoryId: r.categoryId,
    walletId: r.walletId,
    routeId: r.routeId,
    incomeSourceId: r.incomeSourceId,
    isOneTime: r.isOneTime,
    tags: parseTags(r.tags),
    note: r.note,
  };
}

const parentCat = alias(categories, 'parent_cat');

export type TxListItem = {
  id: number;
  date: string;
  kind: string;
  amount: number;
  tags: string | null;
  note: string | null;
  routeId: number | null;
  categoryName: string | null;
  categoryKey: string | null;
  parentName: string | null;
  parentKey: string | null;
  sourceName: string | null;
};

export function listTransactions(opts: { limit?: number; date?: string } = {}): TxListItem[] {
  return db
    .select({
      id: transactions.id,
      date: transactions.date,
      kind: transactions.kind,
      amount: transactions.amount,
      tags: transactions.tags,
      note: transactions.note,
      routeId: transactions.routeId,
      categoryName: categories.name,
      categoryKey: categories.key,
      parentName: parentCat.name,
      parentKey: parentCat.key,
      sourceName: incomeSources.name,
    })
    .from(transactions)
    .leftJoin(categories, eq(categories.id, transactions.categoryId))
    .leftJoin(parentCat, eq(parentCat.id, categories.parentId))
    .leftJoin(incomeSources, eq(incomeSources.id, transactions.incomeSourceId))
    .where(and(notDeleted(), opts.date ? eq(transactions.date, opts.date) : undefined))
    .orderBy(desc(transactions.date), desc(transactions.id))
    .limit(opts.limit ?? 300)
    .all();
}

/** Sum of non-deleted amounts of one kind in [from, to], optionally limited to some categories. */
export function sumAmount(kind: TxKind, from: string, to: string, categoryIds?: number[]): number {
  if (categoryIds && categoryIds.length === 0) return 0;
  const row = db
    .select({ total: sql<number>`coalesce(sum(${transactions.amount}), 0)` })
    .from(transactions)
    .where(
      and(
        notDeleted(),
        eq(transactions.kind, kind),
        gte(transactions.date, from),
        lte(transactions.date, to),
        categoryIds ? inArray(transactions.categoryId, categoryIds) : undefined,
      ),
    )
    .get();
  return Number(row?.total ?? 0);
}

/** Sum of non-deleted one-time expenses (OJT requirements etc.) in [from, to]. */
export function sumOneTime(from: string, to: string): number {
  const row = db
    .select({ total: sql<number>`coalesce(sum(${transactions.amount}), 0)` })
    .from(transactions)
    .where(and(notDeleted(), eq(transactions.kind, 'expense'), eq(transactions.isOneTime, true), gte(transactions.date, from), lte(transactions.date, to)))
    .get();
  return Number(row?.total ?? 0);
}

// ── Categories and wallets ─────────────────────────────────────

export type CategoryLeaf = { id: number; key: string; name: string; icon: string | null };
export type CategoryNode = CategoryLeaf & { bucket: 'needs' | 'gala' | 'savings'; children: CategoryLeaf[] };

export function getCategoryTree(): CategoryNode[] {
  const rows = db.select().from(categories).orderBy(asc(categories.sort)).all();
  const parents: CategoryNode[] = rows
    .filter((r) => r.parentId == null)
    .map((r) => ({ id: r.id, key: r.key, name: r.name, icon: r.icon, bucket: r.bucket, children: [] }));
  const byId = new Map(parents.map((p) => [p.id, p]));
  for (const r of rows) {
    if (r.parentId != null) byId.get(r.parentId)?.children.push({ id: r.id, key: r.key, name: r.name, icon: r.icon });
  }
  return parents;
}

export function getCategoryIdByKey(key: string): number | undefined {
  return db.select({ id: categories.id }).from(categories).where(eq(categories.key, key)).get()?.id;
}

/** A parent category id plus all its children (for envelope totals). */
export function categoryFamilyIds(parentId: number): number[] {
  const kids = db.select({ id: categories.id }).from(categories).where(eq(categories.parentId, parentId)).all();
  return [parentId, ...kids.map((k) => k.id)];
}

/** The wallet quick-log actions use: the first one (the "Cash" wallet made at registration). */
export function getDefaultWalletId(): number | null {
  return db.select({ id: wallets.id }).from(wallets).orderBy(asc(wallets.id)).limit(1).get()?.id ?? null;
}

export function listWallets() {
  return db.select().from(wallets).orderBy(asc(wallets.id)).all();
}

export const TX_TABLES = ['transactions', 'categories', 'wallets', 'income_sources'] as const;
