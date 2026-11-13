import { router } from 'expo-router';
import { ListRow, Section } from '@/components';
import { formatPeso } from '@/lib/money';
import { useLabels } from '@/store/labels';
import { StatusChip } from '../../budgets/components/BudgetEnvelope';
import { useBudgetProgress } from '../../budgets/queries';

const WATCHED = [
  { key: 'food', icon: 'restaurant-outline' },
  { key: 'gala', icon: 'sparkles-outline' },
] as const;

/** This week: food left and gala left, from the weekly Pagkain / Gala envelopes. */
export function WeekCard() {
  const { w } = useLabels();
  const progress = useBudgetProgress().filter((p) => p.budget.period === 'weekly');
  return (
    <Section title="This week" icon="calendar-outline">
      {WATCHED.map(({ key, icon }, i) => {
        const word = key === 'food' ? w('pagkain') : w('gala');
        const p = progress.find((x) => x.categoryKey === key);
        return p ? (
          <ListRow
            key={key}
            icon={icon}
            title={`${word} left`}
            subtitle={`of ${formatPeso(p.available)}`}
            right={<StatusChip status={p.status} />}
            status={p.status === 'over' ? 'Over budget' : p.status === 'near' ? 'Near the limit' : undefined}
            value={p.left >= 0 ? formatPeso(p.left) : `−${formatPeso(-p.left)}`}
            onPress={() => router.push({ pathname: '/budgets/[id]', params: { id: String(p.budget.id) } })}
            last={i === WATCHED.length - 1}
          />
        ) : (
          <ListRow
            key={key}
            icon={icon}
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
