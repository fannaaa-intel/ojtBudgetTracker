import { router } from 'expo-router';
import { ListRow, Section } from '@/components';
import { formatPeso } from '@/lib/money';
import { useLabels } from '@/store/labels';
import { StatusChip } from '../../budgets/components/BudgetEnvelope';
import { useBudgetProgress } from '../../budgets/queries';

const WATCHED = ['food', 'gala'] as const;

/** This week: food left and gala left, from the weekly Pagkain / Gala envelopes. */
export function WeekCard() {
  const { w } = useLabels();
  const progress = useBudgetProgress().filter((p) => p.budget.period === 'weekly');
  return (
    <Section title="This week">
      {WATCHED.map((key, i) => {
        const word = key === 'food' ? w('pagkain') : w('gala');
        const p = progress.find((x) => x.categoryKey === key);
        return p ? (
          <ListRow
            key={key}
            title={`${word} left`}
            subtitle={`${formatPeso(p.spent)} spent of ${formatPeso(p.available)}`}
            right={<StatusChip status={p.status} />}
            value={p.left >= 0 ? formatPeso(p.left) : `−${formatPeso(-p.left)}`}
            onPress={() => router.push({ pathname: '/budgets/[id]', params: { id: String(p.budget.id) } })}
            last={i === WATCHED.length - 1}
          />
        ) : (
          <ListRow
            key={key}
            title={`${word} left`}
            subtitle={`Set a weekly ${word} budget`}
            onPress={() => router.push({ pathname: '/budgets/[id]', params: { id: 'new', category: key, period: 'weekly' } })}
            last={i === WATCHED.length - 1}
          />
        );
      })}
    </Section>
  );
}
