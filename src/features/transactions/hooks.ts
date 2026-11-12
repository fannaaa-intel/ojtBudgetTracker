import { useDbQuery } from '@/db/useDbQuery';
import { getCategoryTree, listTransactions, listWallets, TX_TABLES } from './queries';

export function useTransactions(opts: { limit?: number; date?: string } = {}) {
  return useDbQuery(() => listTransactions(opts), TX_TABLES, [opts.limit, opts.date]);
}

export function useCategoryTree() {
  return useDbQuery(getCategoryTree, ['categories']);
}

export function useWallets() {
  return useDbQuery(listWallets, ['wallets']);
}
