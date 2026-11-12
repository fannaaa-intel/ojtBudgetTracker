import { router } from 'expo-router';
import { AppText, Button, Screen, Section } from '@/components';
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
      subtitle="Tap an entry to edit or delete it."
      footer={<Button label="Add expense" onPress={() => router.push({ pathname: '/transactions/new', params: { kind: 'expense' } })} />}
    >
      {days.length === 0 ? <AppText tone="secondary">Nothing logged yet.</AppText> : null}
      {days.map((d) => (
        <Section key={d.date} title={formatDateLabel(d.date)} action={<AppText variant="caption" tone="secondary">Spent {formatPeso(d.spent)}</AppText>}>
          {d.rows.map((t, i) => (
            <TransactionRow key={t.id} t={t} last={i === d.rows.length - 1} />
          ))}
        </Section>
      ))}
    </Screen>
  );
}
