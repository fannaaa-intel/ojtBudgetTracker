import { router } from 'expo-router';
import { AppText, Button, Screen, Section } from '@/components';
import { BillRow } from '@/features/bills/components/BillRow';
import { useBillsThisMonth } from '@/features/bills/queries';
import { formatPeso } from '@/lib/money';

/** All recurring bills with this month's status. Tap one to pay or edit it. */
export default function Bills() {
  const bills = useBillsThisMonth();
  const unpaid = bills.filter((b) => b.status !== 'paid');
  return (
    <Screen
      insetTop={false}
      title="Rent & bills"
      subtitle={unpaid.length ? `${unpaid.length} unpaid this month · ${formatPeso(unpaid.reduce((s, b) => s + b.bill.amount, 0))}` : bills.length ? 'All paid this month' : undefined}
      footer={<Button label="Add a bill" onPress={() => router.push({ pathname: '/bills/[id]', params: { id: 'new' } })} />}
    >
      {bills.length === 0 ? <AppText tone="secondary">No bills yet. Add rent, electricity, water, Wi-Fi or LPG with its due day.</AppText> : null}
      {bills.length > 0 ? (
        <Section title="This month">
          {bills.map((b, i) => (
            <BillRow key={b.bill.id} b={b} last={i === bills.length - 1} />
          ))}
        </Section>
      ) : null}
    </Screen>
  );
}
