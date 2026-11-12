/**
 * Barkada + ambagan (group gala, Christmas party, exchange gift). Metro Manila only:
 * every read is filtered with barkadaVisible(user region, barkada region) — LGU Talisay sees nothing.
 * My share of an ambagan is logged as a Gala expense. If a member paid, a debt "I owe <member>"
 * is created; if I paid, members' unpaid shares show as owed to me.
 */
import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { ambagan, ambaganShares, barkada, barkadaMembers, debts, type Region } from '@/db/schema';
import { useDbQuery } from '@/db/useDbQuery';
import { AMBAGAN_KINDS, type AmbaganKind } from '@/lib/barkada';
import { todayManila } from '@/lib/dates';
import { barkadaVisible, featuresFor } from '@/lib/region';
import { getProfile } from '../profile/queries';
import { addTransaction, getCategoryIdByKey, getDefaultWalletId, softDeleteTransaction } from '../transactions/queries';

export const BARKADA_TABLES = ['barkada', 'barkada_members', 'ambagan', 'ambagan_shares', 'debts', 'users'] as const;

export type Barkada = typeof barkada.$inferSelect;
export type Member = typeof barkadaMembers.$inferSelect;
export type Ambagan = typeof ambagan.$inferSelect;
export type Share = typeof ambaganShares.$inferSelect;

function userRegion(): Region | undefined {
  return getProfile()?.user.region;
}

export function barkadaAllowed(): boolean {
  const r = userRegion();
  return !!r && featuresFor(r).barkada;
}

export function listBarkadas(): (Barkada & { members: number })[] {
  const r = userRegion();
  if (!r) return [];
  return db
    .select()
    .from(barkada)
    .orderBy(asc(barkada.id))
    .all()
    .filter((b) => barkadaVisible(r, b.region))
    .map((b) => ({ ...b, members: db.select().from(barkadaMembers).where(eq(barkadaMembers.barkadaId, b.id)).all().length }));
}

export function useBarkadas() {
  return useDbQuery(listBarkadas, BARKADA_TABLES);
}

/** One visible barkada with members and ambagan, or undefined (also when the region hides it). */
export function getBarkada(id: number) {
  const r = userRegion();
  const b = db.select().from(barkada).where(eq(barkada.id, id)).get();
  if (!b || !r || !barkadaVisible(r, b.region)) return undefined;
  return {
    barkada: b,
    members: db.select().from(barkadaMembers).where(eq(barkadaMembers.barkadaId, id)).orderBy(asc(barkadaMembers.id)).all(),
    ambagan: db.select().from(ambagan).where(eq(ambagan.barkadaId, id)).orderBy(desc(ambagan.date), desc(ambagan.id)).all(),
  };
}

export function useBarkada(id: number) {
  return useDbQuery(() => getBarkada(id), BARKADA_TABLES, [id]);
}

export function createBarkada(userId: number, name: string): number {
  const r = userRegion();
  if (!r || !featuresFor(r).barkada) throw new Error('Barkada features are for Metro Manila interns only');
  return db.insert(barkada).values({ userId, name: name.trim(), region: r }).returning({ id: barkada.id }).get().id;
}

export function renameBarkada(id: number, name: string): void {
  db.update(barkada).set({ name: name.trim() }).where(eq(barkada.id, id)).run();
}

export function deleteBarkada(id: number): void {
  db.transaction((tx) => {
    for (const a of tx.select().from(ambagan).where(eq(ambagan.barkadaId, id)).all()) {
      tx.delete(debts).where(eq(debts.ambaganId, a.id)).run();
    }
    tx.delete(barkada).where(eq(barkada.id, id)).run(); // members, ambagan, shares cascade
  });
}

export function addMember(barkadaId: number, name: string): void {
  db.insert(barkadaMembers).values({ barkadaId, name: name.trim() }).run();
}

export function removeMember(id: number): void {
  db.delete(barkadaMembers).where(eq(barkadaMembers.id, id)).run();
}

// ── Ambagan ────────────────────────────────────────────────────

export type AmbaganInput = {
  barkadaId: number;
  title: string;
  date: string;
  total: number;
  kind: AmbaganKind;
  splitMode: 'equal' | 'custom';
  /** Member name → share (centavos). */
  shares: { memberName: string; share: number }[];
  mine: number;
  /** 'me' or a member name. */
  paidBy: string;
};

export function createAmbagan(userId: number, i: AmbaganInput): number {
  const categoryKey = AMBAGAN_KINDS.find((k) => k.kind === i.kind)?.categoryKey ?? 'gala';
  return db.transaction((tx) => {
    const txId =
      i.mine > 0
        ? addTransaction(userId, {
            kind: 'expense',
            amount: i.mine,
            date: i.date,
            categoryId: getCategoryIdByKey(categoryKey) ?? null,
            walletId: getDefaultWalletId(),
            tags: [],
            note: `${i.title} · my share`,
          })
        : null;
    const id = tx
      .insert(ambagan)
      .values({ barkadaId: i.barkadaId, title: i.title.trim(), date: i.date, total: i.total, splitMode: i.splitMode, kind: i.kind, paidBy: i.paidBy, transactionId: txId })
      .returning({ id: ambagan.id })
      .get().id;
    for (const s of i.shares) {
      // The payer's own share is settled by definition.
      tx.insert(ambaganShares).values({ ambaganId: id, memberName: s.memberName, share: s.share, paidAt: s.memberName === i.paidBy ? i.date : null }).run();
    }
    if (i.paidBy !== 'me' && i.mine > 0) {
      tx.insert(debts).values({ userId, person: i.paidBy, amount: i.mine, direction: 'i_owe', note: `${i.title} (ambagan)`, ambaganId: id }).run();
    }
    return id;
  });
}

export function getAmbagan(id: number) {
  const a = db.select().from(ambagan).where(eq(ambagan.id, id)).get();
  if (!a) return undefined;
  const b = getBarkada(a.barkadaId);
  if (!b) return undefined;
  return { ambagan: a, barkada: b.barkada, shares: db.select().from(ambaganShares).where(eq(ambaganShares.ambaganId, id)).all() };
}

export function useAmbagan(id: number) {
  return useDbQuery(() => getAmbagan(id), BARKADA_TABLES, [id]);
}

export function setSharePaid(ambaganId: number, memberName: string, paid: boolean): void {
  db.update(ambaganShares)
    .set({ paidAt: paid ? todayManila() : null })
    .where(and(eq(ambaganShares.ambaganId, ambaganId), eq(ambaganShares.memberName, memberName)))
    .run();
}

/** Delete an ambagan: my share's expense is soft-deleted (Undo restores it) and its debt removed. */
export function deleteAmbagan(id: number): void {
  const a = db.select().from(ambagan).where(eq(ambagan.id, id)).get();
  if (!a) return;
  db.transaction((tx) => {
    tx.delete(debts).where(eq(debts.ambaganId, id)).run();
    tx.delete(ambagan).where(eq(ambagan.id, id)).run();
  });
  if (a.transactionId != null) softDeleteTransaction(a.transactionId);
}

/** Members who still owe me for ambagan I paid. */
export function owedFromAmbagan(): { ambaganId: number; title: string; memberName: string; amount: number }[] {
  if (!barkadaAllowed()) return [];
  const rows = db
    .select({ a: ambagan, s: ambaganShares })
    .from(ambaganShares)
    .innerJoin(ambagan, eq(ambagan.id, ambaganShares.ambaganId))
    .where(eq(ambagan.paidBy, 'me'))
    .all();
  return rows.filter((r) => !r.s.paidAt && r.s.share > 0).map((r) => ({ ambaganId: r.a.id, title: r.a.title, memberName: r.s.memberName, amount: r.s.share }));
}

export function useOwedFromAmbagan() {
  return useDbQuery(owedFromAmbagan, BARKADA_TABLES);
}
