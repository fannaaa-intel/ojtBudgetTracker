import { router } from 'expo-router';
import { AppText, ListRow, Section } from '@/components';
import { formatPeso } from '@/lib/money';
import { useBillsThisMonth } from '../queries';
import { BillRow } from './BillRow';

/** Budget tab: this month's bills (unpaid first) + link to all bills. */
export function BillsSummary({ max = 4 }: { max?: number }) {
  const bills = useBillsThisMonth();
  const unpaid = bills.filter((b) => b.status !== 'paid');
  const unpaidTotal = unpaid.reduce((s, b) => s + b.bill.amount, 0);
  const shown = bills.slice(0, max);
  return (
    <Section
      title="Rent & bills this month"
      action={unpaid.length > 0 ? <AppText variant="caption" tone="secondary">{unpaid.length} unpaid · {formatPeso(unpaidTotal)}</AppText> : undefined}
    >
      {shown.map((b) => (
        <BillRow key={b.bill.id} b={b} />
      ))}
      <ListRow title={bills.length === 0 ? 'Add rent or a bill' : 'All bills'} subtitle={bills.length === 0 ? 'Rent, electricity, water, Wi-Fi, LPG' : undefined} onPress={() => router.push('/bills')} last />
    </Section>
  );
}

/** Home "Bills due" line. */
export function useBillsDueLine(): { title: string; subtitle: string } {
  const bills = useBillsThisMonth();
  const overdue = bills.filter((b) => b.status === 'overdue').length;
  const soon = bills.filter((b) => b.status === 'due_soon').length;
  const unpaid = bills.filter((b) => b.status !== 'paid');
  if (bills.length === 0) return { title: 'Bills due', subtitle: 'Add rent and bills to see due dates' };
  if (unpaid.length === 0) return { title: 'Bills due', subtitle: 'All bills paid this month' };
  const parts = [overdue ? `${overdue} overdue` : null, soon ? `${soon} due soon` : null, `${unpaid.length} unpaid · ${formatPeso(unpaid.reduce((s, b) => s + b.bill.amount, 0))}`];
  return { title: 'Bills due', subtitle: parts.filter(Boolean).join(' · ') };
}
