import { router } from 'expo-router';
import { Chip, ListRow } from '@/components';
import { billStatusLabel, type BillStatus } from '@/lib/bills';
import { todayManila } from '@/lib/dates';
import { formatPeso } from '@/lib/money';
import type { BillThisMonth } from '../queries';

/** Overdue = inverse chip, due within 3 days = outlined chip, paid = quiet label. */
export function BillStatusChip({ status, label }: { status: BillStatus; label: string }) {
  if (status === 'overdue') return <Chip label={label} status="inverse" />;
  if (status === 'due_soon') return <Chip label={label} status="outline" />;
  if (status === 'paid') return <Chip label="Paid" status="plain" />;
  return null;
}

export function BillRow({ b, last }: { b: BillThisMonth; last?: boolean }) {
  const label = billStatusLabel(b.status, todayManila(), b.dueDate);
  const amount = b.payment ? b.payment.amount : b.bill.amount;
  return (
    <ListRow
      title={b.bill.name}
      subtitle={b.status === 'upcoming' ? label : `Due day ${b.bill.dueDay}`}
      right={<BillStatusChip status={b.status} label={label} />}
      status={b.status === 'paid' ? 'Paid' : b.status === 'upcoming' ? undefined : label}
      value={amount > 0 ? formatPeso(amount) : undefined}
      onPress={() => router.push({ pathname: '/bills/pay/[id]', params: { id: String(b.bill.id) } })}
      last={last}
    />
  );
}
