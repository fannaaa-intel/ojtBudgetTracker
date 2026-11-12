import { useBudgetProgress } from '../budgets/queries';
import { addTransaction, getCategoryIdByKey, getDefaultWalletId } from '../transactions/queries';

/** This week's gala allowance = the weekly Gala budget envelope (undefined if not set). */
export function useGalaAllowance() {
  return useBudgetProgress().find((p) => p.budget.period === 'weekly' && p.categoryKey === 'gala');
}

/** Log a planned outing as one Gala → Outings expense. */
export function logGala(userId: number, date: string, amount: number, note: string): number {
  const categoryId = getCategoryIdByKey('gala_outing') ?? getCategoryIdByKey('gala') ?? null;
  return addTransaction(userId, { kind: 'expense', amount, date, categoryId, walletId: getDefaultWalletId(), tags: [], note });
}
