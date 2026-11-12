import { View } from 'react-native';
import { AppText } from '@/components';
import { budgetStatus } from '@/lib/budget';
import { formatDateLabel } from '@/lib/dates';
import { formatPeso } from '@/lib/money';
import { useLabels } from '@/store/labels';
import { useTheme } from '@/theme';
import { StatusChip } from '../../budgets/components/BudgetEnvelope';
import { useSafeToSpend } from '../../budgets/queries';
import { useDaySummary } from '../queries';

/** Inverse hero card: spent today vs today's limit (from weekly budgets). */
export function TodayCard() {
  const { colors, radius, spacing } = useTheme();
  const day = useDaySummary();
  const { cat } = useLabels();
  const safe = useSafeToSpend();
  const status = safe ? budgetStatus(safe.spentToday, safe.dailyLimit) : 'ok';

  return (
    <View style={{ backgroundColor: colors.inverse, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xs }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: spacing.sm, rowGap: spacing.xs }}>
        <AppText variant="label" tone="inverse" style={{ flexShrink: 1 }}>
          Today · {formatDateLabel(day.today)}
        </AppText>
        <StatusChip status={status} onInverse />
      </View>
      <AppText variant="amountLarge" tone="inverse">
        {formatPeso(day.spentToday)}
      </AppText>
      <AppText variant="caption" tone="inverse">
        {safe
          ? safe.left >= 0
            ? `Daily limit ${formatPeso(safe.dailyLimit)} · ${formatPeso(safe.left)} left`
            : `Daily limit ${formatPeso(safe.dailyLimit)} · ${formatPeso(-safe.left)} over`
          : 'Spent today. Add a weekly or monthly budget to get a daily limit.'}
      </AppText>
      {day.byCategory.length > 0 ? (
        <AppText variant="caption" tone="inverse" style={{ opacity: 0.75 }}>
          {day.byCategory.map((c) => `${cat(c.key, c.name)} ${formatPeso(c.amount)}`).join(' · ')}
        </AppText>
      ) : null}
    </View>
  );
}
