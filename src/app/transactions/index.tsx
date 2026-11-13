import { router } from 'expo-router';
import { Appear, AppText, Button, EmptyState, Screen, Section } from '@/components';
import { TransactionRow } from '@/features/transactions/components/TransactionRow';
import { useTransactions } from '@/features/transactions/hooks';
import type { TxListItem } from '@/features/transactions/queries';
import { formatDateLabel } from '@/lib/dates';
import { formatPeso } from '@/lib/money';

/** All transactions, newest first, grouped by day with the day's spending. */
export default function History() {
  const items = useTransactions({ limit: 500 });

  const days: { date: string; spent: number; rows: TxListItem[] }[] = [];
  for (const t of items) {
    let day = days[days.length - 1];
    if (!day || day.date !== t.date) {
      day = { date: t.date, spent: 0, rows: [] };
      days.push(day);
    }
    day.rows.push(t);
    if (t.kind === 'expense') day.spent += t.amount;
  }

  return (
    <Screen
      insetTop={false}
      title="History"
      subtitle={days.length ? 'Tap an entry to edit it.' : undefined}
      footer={<Button label="Add expense" onPress={() => router.push({ pathname: '/transactions/new', params: { kind: 'expense' } })} />}
    >
      {days.length === 0 ? <EmptyState icon="receipt-outline" message="Nothing logged yet." /> : null}
      {days.map((d, i) => (
        <Appear key={d.date} index={i}>
          <Section
            title={formatDateLabel(d.date)}
            action={
              <AppText variant="caption" tone="secondary" style={{ fontVariant: ['tabular-nums'] }}>
                {formatPeso(d.spent)} spent
              </AppText>
            }
          >
            {d.rows.map((t, j) => (
              <TransactionRow key={t.id} t={t} last={j === d.rows.length - 1} />
            ))}
          </Section>
        </Appear>
      ))}
    </Screen>
  );
}
