import { router } from 'expo-router';
import { Appear, Button, EmptyState, Screen, Section } from '@/components';
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
      subtitle={unpaid.length ? `${formatPeso(unpaid.reduce((s, b) => s + b.bill.amount, 0))} unpaid this month` : bills.length ? 'All paid this month' : undefined}
      footer={<Button label="Add a bill" onPress={() => router.push({ pathname: '/bills/[id]', params: { id: 'new' } })} />}
    >
      {bills.length === 0 ? <EmptyState icon="receipt-outline" message="Add rent, power, water, Wi-Fi or LPG." /> : null}
      {bills.length > 0 ? (
        <Section title="This month" icon="calendar-number-outline">
          {bills.map((b, i) => (
            <Appear key={b.bill.id} index={i} rise={6}>
              <BillRow b={b} last={i === bills.length - 1} />
            </Appear>
          ))}
        </Section>
      ) : null}
    </Screen>
  );
}
