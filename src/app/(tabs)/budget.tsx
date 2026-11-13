import { router } from 'expo-router';
import { Appear, Button, EmptyState, ListRow, Screen, Section } from '@/components';
import { BillsSummary } from '@/features/bills/components/BillsSummary';
import { BudgetEnvelope } from '@/features/budgets/components/BudgetEnvelope';
import { SafeToSpendCard } from '@/features/budgets/components/SafeToSpendCard';
import { useBudgetProgress } from '@/features/budgets/queries';
import { useGoals } from '@/features/savings/queries';
import { formatDateLabel } from '@/lib/dates';
import { useLabels } from '@/store/labels';

export default function Budget() {
  const progress = useBudgetProgress();
  const weekly = progress.filter((p) => p.budget.period === 'weekly');
  const monthly = progress.filter((p) => p.budget.period === 'monthly');
  const goals = useGoals();
  const topGoal = [...goals].sort((a, b) => b.pct - a.pct)[0];
  const { w } = useLabels();

  return (
    <Screen title="Budget">
      <Appear grow>
        <SafeToSpendCard />
      </Appear>
      {weekly.length > 0 ? (
        <Appear index={1}>
          <Section title={`This week, until ${formatDateLabel(weekly[0].range.to)}`} icon="calendar-outline">
            {weekly.map((p, i) => (
              <BudgetEnvelope key={p.budget.id} p={p} index={i} last={i === weekly.length - 1} />
            ))}
          </Section>
        </Appear>
      ) : null}
      {monthly.length > 0 ? (
        <Appear index={2}>
          <Section title="This month" icon="calendar-number-outline">
            {monthly.map((p, i) => (
              <BudgetEnvelope key={p.budget.id} p={p} index={i} last={i === monthly.length - 1} />
            ))}
          </Section>
        </Appear>
      ) : null}
      {progress.length === 0 ? (
        <Section title="Envelopes" icon="mail-outline">
          <EmptyState icon="pie-chart-outline" message={`Start with a weekly ${w('pagkain')} or ${w('pamasahe')} envelope.`} />
        </Section>
      ) : null}
      <Button label="Add budget" onPress={() => router.push({ pathname: '/budgets/[id]', params: { id: 'new' } })} />
      <Appear index={3}>
        <BillsSummary />
      </Appear>
      <Appear index={4}>
        <Section title={`${w('gala')} & savings`} icon="sparkles-outline">
          <ListRow icon="map-outline" title={`${w('gala')} planner`} subtitle="Plan fare, food and activity" onPress={() => router.push('/gala')} />
          <ListRow
            icon="flag-outline"
            title="Savings & emergency fund"
            subtitle={topGoal ? `${topGoal.goal.name}, ${topGoal.pct}%` : 'Goals and a 1-month fund'}
            onPress={() => router.push('/savings')}
            last
          />
        </Section>
      </Appear>
    </Screen>
  );
}
