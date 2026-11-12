import { router } from 'expo-router';
import { ListRow, Section } from '@/components';
import { formatPeso } from '@/lib/money';
import { StatusChip } from '../../budgets/components/BudgetEnvelope';
import { useBudgetProgress } from '../../budgets/queries';

const WATCHED = [
  { key: 'food', label: 'Food left' },
  { key: 'gala', label: 'Gala left' },
] as const;

/** This week: food left and gala left, from the weekly Pagkain / Gala envelopes. */
export function WeekCard() {
  const progress = useBudgetProgress().filter((p) => p.budget.period === 'weekly');
  return (
    <Section title="This week">
      {WATCHED.map((w, i) => {
        const p = progress.find((x) => x.categoryKey === w.key);
        return p ? (
          <ListRow
            key={w.key}
            title={w.label}
            subtitle={`${formatPeso(p.spent)} spent of ${formatPeso(p.available)}`}
            right={<StatusChip status={p.status} />}
            value={p.left >= 0 ? formatPeso(p.left) : `−${formatPeso(-p.left)}`}
            onPress={() => router.push({ pathname: '/budgets/[id]', params: { id: String(p.budget.id) } })}
            last={i === WATCHED.length - 1}
          />
        ) : (
          <ListRow
            key={w.key}
            title={w.label}
            subtitle={`Set a weekly ${w.key === 'food' ? 'Pagkain' : 'Gala'} budget`}
            onPress={() => router.push({ pathname: '/budgets/[id]', params: { id: 'new' } })}
            last={i === WATCHED.length - 1}
          />
        );
      })}
    </Section>
  );
}
