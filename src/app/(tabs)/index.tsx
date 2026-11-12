import { router } from 'expo-router';
import { Button, ListRow, Screen, Section } from '@/components';
import { TodayCard } from '@/features/home/components/TodayCard';
import { WeekCard } from '@/features/home/components/WeekCard';
import { useDaySummary } from '@/features/home/queries';
import { useNextAllowanceLabel } from '@/features/income/components/NextAllowance';
import { useProfile } from '@/features/profile/queries';
import { TransactionRow } from '@/features/transactions/components/TransactionRow';
import { useTransactions } from '@/features/transactions/hooks';
import { formatPeso } from '@/lib/money';

/** Home: today vs daily limit, this week's food/gala left, this month, recent entries. */
export default function Home() {
  const profile = useProfile();
  const day = useDaySummary();
  const recent = useTransactions({ limit: 5 });
  const allowance = useNextAllowanceLabel();

  return (
    <Screen title={`Hi, ${profile?.user.nickname || profile?.user.name || 'intern'}`} subtitle={profile?.agency.shortName}>
      <TodayCard />
      <WeekCard />

      <Section title="This month">
        <ListRow title="Spent this month" value={formatPeso(day.spentThisMonth)} />
        <ListRow title="Income this month" value={formatPeso(day.incomeThisMonth)} />
        {allowance ? (
          <ListRow title={allowance.title} subtitle={allowance.detail} onPress={() => router.push('/income')} />
        ) : (
          <ListRow title="Next allowance" subtitle="Add your baon or stipend schedule" onPress={() => router.push('/income')} />
        )}
        <ListRow title="Bills due" subtitle="Rent and bills arrive in Phase 2" last />
      </Section>

      <Section title="Recent">
        {recent.length === 0 ? (
          <ListRow title="Nothing logged yet" subtitle="Use the + tab to log your first expense" last />
        ) : (
          recent.map((t, i) => <TransactionRow key={t.id} t={t} last={i === recent.length - 1} />)
        )}
      </Section>
      {recent.length > 0 ? <Button label="See all history" variant="ghost" onPress={() => router.push('/transactions')} /> : null}
    </Screen>
  );
}
