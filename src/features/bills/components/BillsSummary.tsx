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
      title="Rent & bills"
      icon="receipt-outline"
      action={unpaid.length > 0 ? <AppText variant="caption" tone="secondary">{formatPeso(unpaidTotal)} unpaid</AppText> : undefined}
    >
      {shown.map((b) => (
        <BillRow key={b.bill.id} b={b} />
      ))}
      <ListRow
        icon={bills.length === 0 ? 'add-outline' : 'list-outline'}
        title={bills.length === 0 ? 'Add rent or a bill' : 'All bills'}
        subtitle={bills.length === 0 ? 'Rent, power, water, Wi-Fi, LPG' : undefined}
        onPress={() => router.push('/bills')}
        last
      />
    </Section>
  );
}

/** Home "Bills due" row: one short fact as subtitle, unpaid total as the value. */
export function useBillsDueLine(): { title: string; subtitle: string; value?: string; urgent: 'overdue' | 'soon' | null } {
  const bills = useBillsThisMonth();
  const overdue = bills.filter((b) => b.status === 'overdue').length;
  const soon = bills.filter((b) => b.status === 'due_soon').length;
  const unpaid = bills.filter((b) => b.status !== 'paid');
  if (bills.length === 0) return { title: 'Bills due', subtitle: 'Add rent and bills', urgent: null };
  if (unpaid.length === 0) return { title: 'Bills due', subtitle: 'All paid this month', urgent: null };
  const subtitle = overdue ? `${overdue} overdue` : soon ? `${soon} due soon` : `${unpaid.length} unpaid`;
  return { title: 'Bills due', subtitle, value: formatPeso(unpaid.reduce((s, b) => s + b.bill.amount, 0)), urgent: overdue ? 'overdue' : soon ? 'soon' : null };
}
