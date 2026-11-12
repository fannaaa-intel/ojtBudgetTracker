import { formatDateLabel } from '@/lib/dates';
import { formatPeso } from '@/lib/money';
import { daysUntilLabel } from '@/lib/paySchedule';
import { useNextAllowance } from '../queries';

/** "Baon from Mama ₱1,500 tomorrow (Fri, Nov 13, 2026)" or undefined when nothing is scheduled. */
export function useNextAllowanceLabel(): { title: string; detail: string; days: number } | undefined {
  const next = useNextAllowance();
  if (!next) return undefined;
  return {
    title: next.days <= 0 ? 'Allowance today' : `Next allowance ${daysUntilLabel(next.days)}`,
    detail: `${next.source.name} · ${formatPeso(next.source.amount)} · ${formatDateLabel(next.date)}`,
    days: next.days,
  };
}
