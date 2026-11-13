import { formatDateLabel } from '@/lib/dates';
import { formatPeso } from '@/lib/money';
import { daysUntilLabel } from '@/lib/paySchedule';
import { useNextAllowance } from '../queries';

/** Title "Next allowance tomorrow", detail "Baon from Mama, Fri, Nov 13", amount — or undefined. */
export function useNextAllowanceLabel(): { title: string; detail: string; amount: string; days: number } | undefined {
  const next = useNextAllowance();
  if (!next) return undefined;
  return {
    title: next.days <= 0 ? 'Allowance today' : `Next allowance ${daysUntilLabel(next.days)}`,
    detail: `${next.source.name}, ${formatDateLabel(next.date)}`,
    amount: formatPeso(next.source.amount),
    days: next.days,
  };
}
