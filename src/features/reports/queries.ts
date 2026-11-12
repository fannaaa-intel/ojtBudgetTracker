import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { transactions } from '@/db/schema';
import { useDbQuery } from '@/db/useDbQuery';
import { todayManila, type ISODate } from '@/lib/dates';
import { averagePerDay, dayCount, reportRange, spendingSeries, withShares, type ReportPeriod } from '@/lib/reports';
import { getProfile } from '../profile/queries';
import { categoryFamilyIds, getCategoryTree, notDeleted, sumAmount, sumOneTime } from '../transactions/queries';

function dailyTotals(from: ISODate, to: ISODate): Map<ISODate, number> {
  const rows = db
    .select({ date: transactions.date, total: sql<number>`sum(${transactions.amount})` })
    .from(transactions)
    .where(and(notDeleted(), eq(transactions.kind, 'expense'), gte(transactions.date, from), lte(transactions.date, to)))
    .groupBy(transactions.date)
    .all();
  return new Map(rows.map((r) => [r.date, Number(r.total)]));
}

export function getReport(period: ReportPeriod, today: ISODate = todayManila()) {
  const start = getProfile()?.profile.startDate ?? today;
  const { from, to } = reportRange(period, today, start);
  const days = dayCount(from, to);
  const total = sumAmount('expense', from, to);
  const tree = getCategoryTree();
  const categories = withShares(tree.map((p) => ({ key: p.key, name: p.name, bucket: p.bucket, amount: sumAmount('expense', from, to, categoryFamilyIds(p.id)) })));
  const gala = categories.filter((c) => c.bucket === 'gala').reduce((s, c) => s + c.amount, 0);
  return {
    period,
    from,
    to,
    days,
    total,
    avgPerDay: averagePerDay(total, days),
    oneTime: sumOneTime(from, to),
    needs: total - gala,
    gala,
    categories,
    series: spendingSeries(dailyTotals(from, to), from, to),
  };
}

export type Report = ReturnType<typeof getReport>;

export function useReport(period: ReportPeriod) {
  return useDbQuery(() => getReport(period), ['transactions', 'categories', 'ojt_profile'], [period]);
}
