/**
 * "Total OJT cost" PDF and all-transactions CSV → share sheet. Offline: files are written on the
 * phone; where they go is the user's choice.
 */
import { and, asc, eq, gte, lte, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { db } from '@/db/client';
import { categories, transactions, wallets } from '@/db/schema';
import { todayManila } from '@/lib/dates';
import { daysWorked as countDaysWorked } from '@/lib/ojt';
import { monthLabel, ojtReportHtml, transactionsCsv, type OjtReportData } from '@/lib/export';
import { REGION_LABEL } from '@/lib/region';
import { withShares } from '@/lib/reports';
import { getOjtState } from '../ojt/queries';
import { getProfile } from '../profile/queries';
import { categoryFamilyIds, getCategoryTree, notDeleted, sumAmount, sumOneTime } from '../transactions/queries';

export function buildOjtReportData(): OjtReportData | undefined {
  const p = getProfile();
  const s = getOjtState();
  if (!p || !s) return undefined;
  const today = todayManila();
  const from = s.startDate <= today ? s.startDate : today;
  const byCategory = withShares(getCategoryTree().map((c) => ({ name: c.name, amount: sumAmount('expense', from, today, categoryFamilyIds(c.id)) })));
  const months = db
    .select({ period: sql<string>`substr(${transactions.date}, 1, 7)`, total: sql<number>`sum(${transactions.amount})` })
    .from(transactions)
    .where(and(notDeleted(), eq(transactions.kind, 'expense'), gte(transactions.date, from), lte(transactions.date, today)))
    .groupBy(sql`substr(${transactions.date}, 1, 7)`)
    .orderBy(sql`1`)
    .all();
  return {
    name: p.user.name,
    school: p.user.school,
    agency: p.agency.shortName,
    region: REGION_LABEL[p.user.region],
    startDate: s.startDate,
    today,
    hoursDone: s.hoursDone,
    requiredHours: s.requiredHours,
    endDate: s.projection.endDate,
    daysWorked: countDaysWorked([...s.logs.values()]),
    totalSpent: s.totalSpent,
    oneTime: sumOneTime(from, today),
    costPerDay: s.projection.costPerDay,
    costPerHour: s.projection.costPerHour,
    projectedTotal: s.projection.projectedTotal,
    byCategory,
    byMonth: months.map((m) => ({ label: monthLabel(m.period), amount: Number(m.total) })),
  };
}

async function share(uri: string, mimeType: string, UTI: string, dialogTitle: string) {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this phone');
  await Sharing.shareAsync(uri, { mimeType, UTI, dialogTitle });
}

export async function exportOjtPdf(): Promise<void> {
  const data = buildOjtReportData();
  if (!data) throw new Error('Register first');
  const { uri } = await Print.printToFileAsync({ html: ojtReportHtml(data) });
  // Give the file a readable name before sharing.
  const named = new File(Paths.cache, `ojt-cost-report-${data.today}.pdf`);
  if (named.exists) named.delete();
  await new File(uri).move(named);
  await share(named.uri, 'application/pdf', 'com.adobe.pdf', 'Save or send your OJT cost report');
}

export async function exportTransactionsCsv(): Promise<number> {
  const parent = alias(categories, 'parent_cat');
  const rows = db
    .select({ t: transactions, cat: categories.name, parent: parent.name, wallet: wallets.name })
    .from(transactions)
    .leftJoin(categories, eq(categories.id, transactions.categoryId))
    .leftJoin(parent, eq(parent.id, categories.parentId))
    .leftJoin(wallets, eq(wallets.id, transactions.walletId))
    .where(notDeleted())
    .orderBy(asc(transactions.date), asc(transactions.id))
    .all();
  const csv = transactionsCsv(
    rows.map((r) => ({
      date: r.t.date,
      kind: r.t.kind,
      category: r.parent && r.cat ? `${r.parent} · ${r.cat}` : (r.cat ?? (r.t.kind === 'income' ? 'Income' : '')),
      amount: r.t.amount,
      wallet: r.wallet,
      tags: r.t.tags,
      note: r.t.note,
      oneTime: r.t.isOneTime,
    })),
  );
  const file = new File(Paths.cache, `ojt-budget-transactions-${todayManila()}.csv`);
  if (file.exists) file.delete();
  file.create();
  file.writeSync(csv);
  await share(file.uri, 'text/csv', 'public.comma-separated-values-text', 'Save or send your transactions');
  return rows.length;
}
