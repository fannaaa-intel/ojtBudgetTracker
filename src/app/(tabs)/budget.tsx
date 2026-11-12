import { router } from 'expo-router';
import { AppText, Button, ListRow, Screen, Section } from '@/components';
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
  const { w } = useLabels();

  return (
    <Screen title="Budget" subtitle="Envelopes per category. Weeks run Monday to Sunday.">
      <SafeToSpendCard />
      {weekly.length > 0 ? (
        <Section title={`This week · until ${formatDateLabel(weekly[0].range.to)}`}>
          {weekly.map((p, i) => (
            <BudgetEnvelope key={p.budget.id} p={p} last={i === weekly.length - 1} />
          ))}
        </Section>
      ) : null}
      {monthly.length > 0 ? (
        <Section title="This month">
          {monthly.map((p, i) => (
            <BudgetEnvelope key={p.budget.id} p={p} last={i === monthly.length - 1} />
          ))}
        </Section>
      ) : null}
      {progress.length === 0 ? <AppText tone="secondary">No budgets yet. Start with a weekly {w('pagkain')} or {w('pamasahe')} envelope.</AppText> : null}
      <Button label="Add budget" onPress={() => router.push({ pathname: '/budgets/[id]', params: { id: 'new' } })} />
      <BillsSummary />
      <Section title={`${w('gala')} & savings`}>
        <ListRow title={`${w('gala')} planner`} subtitle="Weekly allowance · plan fare, food and activity" onPress={() => router.push('/gala')} />
        <ListRow
          title="Savings & emergency fund"
          subtitle={goals.length ? goals.map((g) => `${g.goal.name} ${g.pct}%`).join(' · ') : 'Goals and a 1-month emergency fund'}
          onPress={() => router.push('/savings')}
          last
        />
      </Section>
    </Screen>
  );
}
