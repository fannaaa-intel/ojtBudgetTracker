import { router } from 'expo-router';
import { Button, Chip, ListRow, Screen, Section } from '@/components';
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

/** Home: today vs daily limit, this week's food/gala left, this month, recent entries. */
export default function Home() {
  const profile = useProfile();
  const day = useDaySummary();
  const recent = useTransactions({ limit: 5 });
  const allowance = useNextAllowanceLabel();
  const bills = useBillsDueLine();
  const dueEssentials = useEssentials().filter((e) => e.status === 'overdue' || e.status === 'due_soon');

  return (
    <Screen title={`Hi, ${profile?.user.nickname || profile?.user.name || 'intern'}`} subtitle={profile?.agency.shortName}>
      <TodayCard />
      <OjtTodayCard />
      <WeekCard />
      <OjtProgressCard />

      <Section title="This month">
        <ListRow title="Spent this month" value={formatPeso(day.spentThisMonth)} />
        <ListRow title="Income this month" value={formatPeso(day.incomeThisMonth)} />
        {allowance ? (
          <ListRow title={allowance.title} subtitle={allowance.detail} onPress={() => router.push('/income')} />
        ) : (
          <ListRow title="Next allowance" subtitle="Add your baon or stipend schedule" onPress={() => router.push('/income')} />
        )}
        <ListRow title={bills.title} subtitle={bills.subtitle} onPress={() => router.push('/bills')} last={dueEssentials.length === 0} />
        {dueEssentials.length > 0 ? (
          <ListRow
            title="Essentials running out"
            subtitle={dueEssentials.slice(0, 3).map((e) => e.item.name).join(', ') + (dueEssentials.length > 3 ? ` +${dueEssentials.length - 3} more` : '')}
            right={<Chip label={String(dueEssentials.length)} status={dueEssentials.some((e) => e.status === 'overdue') ? 'inverse' : 'outline'} />}
            onPress={() => router.push('/essentials')}
            last
          />
        ) : null}
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
