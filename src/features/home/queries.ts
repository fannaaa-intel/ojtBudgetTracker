import { useDbQuery } from '@/db/useDbQuery';
import { periodRange } from '@/lib/budget';
import { todayManila, type ISODate } from '@/lib/dates';
import { categoryFamilyIds, getCategoryTree, sumAmount } from '../transactions/queries';

export type DaySummary = {
  today: ISODate;
  spentToday: number;
  /** Today's spending per top-level category, largest first, zeros left out. */
  byCategory: { name: string; amount: number }[];
  spentThisMonth: number;
  incomeThisMonth: number;
};

export function getDaySummary(today: ISODate = todayManila()): DaySummary {
  const month = periodRange('monthly', today);
  const byCategory = getCategoryTree()
    .map((p) => ({ name: p.name, amount: sumAmount('expense', today, today, categoryFamilyIds(p.id)) }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  return {
    today,
    spentToday: sumAmount('expense', today, today),
    byCategory,
    spentThisMonth: sumAmount('expense', month.from, month.to),
    incomeThisMonth: sumAmount('income', month.from, month.to),
  };
}

export function useDaySummary() {
  return useDbQuery(() => getDaySummary(), ['transactions', 'categories']);
}
