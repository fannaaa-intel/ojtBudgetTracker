import { asc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { incomeSources, transactions } from '@/db/schema';
import { useDbQuery } from '@/db/useDbQuery';
import { todayManila, type ISODate } from '@/lib/dates';
import { daysBetween, nextPayDate, type PayFrequency } from '@/lib/paySchedule';

export type IncomeSource = typeof incomeSources.$inferSelect;

export function listIncomeSources(): IncomeSource[] {
  return db.select().from(incomeSources).orderBy(asc(incomeSources.id)).all();
}

export function useIncomeSources() {
  return useDbQuery(listIncomeSources, ['income_sources']);
}

export function getIncomeSource(id: number): IncomeSource | undefined {
  return db.select().from(incomeSources).where(eq(incomeSources.id, id)).get();
}

export type IncomeSourceInput = { name: string; amount: number; frequency: PayFrequency; nextDate: ISODate | null };

export function saveIncomeSource(userId: number, id: number | undefined, input: IncomeSourceInput): number {
  const values = { name: input.name.trim(), amount: input.amount, frequency: input.frequency, nextDate: input.nextDate };
  if (id == null) return db.insert(incomeSources).values({ userId, ...values }).returning({ id: incomeSources.id }).get().id;
  db.update(incomeSources).set(values).where(eq(incomeSources.id, id)).run();
  return id;
}

/** Delete a source. Income already logged from it stays (only the link is cleared). */
export function deleteIncomeSource(id: number): void {
  db.transaction((tx) => {
    tx.update(transactions).set({ incomeSourceId: null }).where(eq(transactions.incomeSourceId, id)).run();
    tx.delete(incomeSources).where(eq(incomeSources.id, id)).run();
  });
}

export type Upcoming = { source: IncomeSource; date: ISODate; days: number };

/** Every source's next payday, soonest first. Sources without an upcoming date are left out. */
export function upcomingAllowances(today: ISODate = todayManila()): Upcoming[] {
  return listIncomeSources()
    .flatMap((s) => {
      const date = nextPayDate(s.frequency, s.nextDate, today);
      return date ? [{ source: s, date, days: daysBetween(today, date) }] : [];
    })
    .sort((a, b) => a.days - b.days || a.source.id - b.source.id);
}

export function useNextAllowance(): Upcoming | undefined {
  return useDbQuery(() => upcomingAllowances()[0], ['income_sources']);
}
