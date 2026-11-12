import { router } from 'expo-router';
import { AppText, Button, Screen, Section } from '@/components';
import { TodoList } from '@/components/TodoList';
import { BudgetEnvelope } from '@/features/budgets/components/BudgetEnvelope';
import { SafeToSpendCard } from '@/features/budgets/components/SafeToSpendCard';
import { useBudgetProgress } from '@/features/budgets/queries';
import { formatDateLabel } from '@/lib/dates';

export default function Budget() {
  const progress = useBudgetProgress();
  const weekly = progress.filter((p) => p.budget.period === 'weekly');
  const monthly = progress.filter((p) => p.budget.period === 'monthly');

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
      {progress.length === 0 ? <AppText tone="secondary">No budgets yet. Start with a weekly Pagkain or Pamasahe envelope.</AppText> : null}
      <Button label="Add budget" onPress={() => router.push({ pathname: '/budgets/[id]', params: { id: 'new' } })} />
      <TodoList phase="Phase 2" items={['Bills & rent with due dates', 'Roommate split', 'Gala allowance + planner', 'Savings goals + emergency fund']} />
    </Screen>
  );
}
