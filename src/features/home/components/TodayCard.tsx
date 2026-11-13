import { View } from 'react-native';
import { AnimatedAmount, AppText, ProgressBar } from '@/components';
import { budgetStatus } from '@/lib/budget';
import { formatDateLabel } from '@/lib/dates';
import { formatPeso } from '@/lib/money';
import { useLabels } from '@/store/labels';
import { useTheme } from '@/theme';
import { StatusChip } from '../../budgets/components/BudgetEnvelope';
import { useSafeToSpend } from '../../budgets/queries';
import { useDaySummary } from '../queries';

const TOP = 3;

/** Inverse hero card: spent today (counts up), today's limit and what's left, top 3 categories. */
export function TodayCard() {
  const { colors, radius, spacing } = useTheme();
  const day = useDaySummary();
  const { cat } = useLabels();
  const safe = useSafeToSpend();
  const status = safe ? budgetStatus(safe.spentToday, safe.dailyLimit) : 'ok';
  const top = day.byCategory.slice(0, TOP);

  return (
    <View style={{ backgroundColor: colors.inverse, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.md }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: spacing.sm, rowGap: spacing.xs }}>
        <AppText variant="label" tone="inverse" style={{ flexShrink: 1 }}>
          Today, {formatDateLabel(day.today)}
        </AppText>
        <StatusChip status={status} onInverse />
      </View>

      <AnimatedAmount value={day.spentToday} variant="amountLarge" tone="inverse" />

      {safe ? (
        <View style={{ gap: spacing.sm }}>
          <ProgressBar pct={safe.dailyLimit > 0 ? (safe.spentToday / safe.dailyLimit) * 100 : 0} onInverse />
          <View style={{ flexDirection: 'row', gap: spacing.lg }}>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="caption" tone="inverse" style={{ opacity: 0.7 }}>
                Daily limit
              </AppText>
              <AppText variant="amount" tone="inverse">
                {formatPeso(safe.dailyLimit)}
              </AppText>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="caption" tone="inverse" style={{ opacity: 0.7 }}>
                {safe.left >= 0 ? 'Left today' : 'Over today'}
              </AppText>
              <AnimatedAmount value={Math.abs(safe.left)} tone="inverse" />
            </View>
          </View>
        </View>
      ) : (
        <AppText variant="caption" tone="inverse" style={{ opacity: 0.8 }}>
          Add a budget to get a daily limit.
        </AppText>
      )}

      {top.length > 0 ? (
        <View style={{ gap: spacing.xs, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.textSecondary }}>
          {top.map((c) => (
            <View key={c.key} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
              <AppText variant="caption" tone="inverse" style={{ flex: 1, opacity: 0.8 }} numberOfLines={1}>
                {cat(c.key, c.name)}
              </AppText>
              <AppText variant="caption" tone="inverse" style={{ fontVariant: ['tabular-nums'] }}>
                {formatPeso(c.amount)}
              </AppText>
            </View>
          ))}
          {day.byCategory.length > TOP ? (
            <AppText variant="caption" tone="inverse" style={{ opacity: 0.6 }}>
              +{day.byCategory.length - TOP} more
            </AppText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
