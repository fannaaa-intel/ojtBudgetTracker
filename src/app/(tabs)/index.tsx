import { router } from 'expo-router';
import { Appear, Button, Chip, EmptyState, ListRow, Screen, Section } from '@/components';
import { useBillsDueLine } from '@/features/bills/components/BillsSummary';
import { useEssentials } from '@/features/essentials/queries';
import { TodayCard } from '@/features/home/components/TodayCard';
import { WeekCard } from '@/features/home/components/WeekCard';
import { useDaySummary } from '@/features/home/queries';
import { useNextAllowanceLabel } from '@/features/income/components/NextAllowance';
import { OjtProgressCard } from '@/features/ojt/components/OjtProgressCard';
import { OjtTodayCard } from '@/features/ojt/components/OjtTodayCard';
import { useProfile } from '@/features/profile/queries';
import { TransactionRow } from '@/features/transactions/components/TransactionRow';
import { useTransactions } from '@/features/transactions/hooks';
import { formatPeso } from '@/lib/money';

/** Home: today (hero), OJT today, this week, OJT progress, this month, recent entries. */
export default function Home() {
  const profile = useProfile();
  const day = useDaySummary();
  const recent = useTransactions({ limit: 5 });
  const allowance = useNextAllowanceLabel();
  const bills = useBillsDueLine();
  const dueEssentials = useEssentials().filter((e) => e.status === 'overdue' || e.status === 'due_soon');

  return (
    <Screen title={`Hi, ${profile?.user.nickname || profile?.user.name || 'intern'}`} subtitle={profile?.agency.shortName}>
      <Appear grow>
        <TodayCard />
      </Appear>
      <Appear index={1}>
        <OjtTodayCard />
      </Appear>
      <Appear index={2}>
        <WeekCard />
      </Appear>
      <Appear index={3}>
        <OjtProgressCard compact />
      </Appear>

      <Appear index={4}>
        <Section title="This month" icon="calendar-number-outline">
          <ListRow icon="arrow-up-outline" title="Spent" value={formatPeso(day.spentThisMonth)} />
          <ListRow icon="arrow-down-outline" title="Income" value={formatPeso(day.incomeThisMonth)} />
          {allowance ? (
            <ListRow icon="wallet-outline" title={allowance.title} subtitle={allowance.detail} value={allowance.amount} onPress={() => router.push('/income')} />
          ) : (
            <ListRow icon="wallet-outline" title="Next allowance" subtitle="Add your baon or stipend" onPress={() => router.push('/income')} />
          )}
          <ListRow
            icon="receipt-outline"
            title={bills.title}
            subtitle={bills.subtitle}
            value={bills.value}
            right={bills.urgent === 'overdue' ? <Chip label="Overdue" status="inverse" /> : bills.urgent === 'soon' ? <Chip label="Due soon" status="outline" /> : undefined}
            status={bills.urgent === 'overdue' ? 'Overdue' : bills.urgent === 'soon' ? 'Due soon' : undefined}
            onPress={() => router.push('/bills')}
            last={dueEssentials.length === 0}
          />
          {dueEssentials.length > 0 ? (
            <ListRow
              icon="basket-outline"
              title="Running out"
              subtitle={dueEssentials.length === 1 ? dueEssentials[0].item.name : `${dueEssentials[0].item.name} and ${dueEssentials.length - 1} more`}
              right={<Chip label={String(dueEssentials.length)} status={dueEssentials.some((e) => e.status === 'overdue') ? 'inverse' : 'outline'} />}
              onPress={() => router.push('/essentials')}
              last
            />
          ) : null}
        </Section>
      </Appear>

      <Appear index={5}>
        {recent.length === 0 ? (
          <Section title="Recent" icon="time-outline">
            <EmptyState icon="receipt-outline" message="Nothing logged yet." actionLabel="Log an expense" onAction={() => router.push('/add')} />
          </Section>
        ) : (
          <Section title="Recent" icon="time-outline">
            {recent.map((t, i) => (
              <TransactionRow key={t.id} t={t} last={i === recent.length - 1} />
            ))}
          </Section>
        )}
      </Appear>
      {recent.length > 0 ? <Button label="See all history" variant="ghost" onPress={() => router.push('/transactions')} /> : null}
    </Screen>
  );
}
