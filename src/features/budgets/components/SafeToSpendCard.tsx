import { View } from 'react-native';
import { AppText } from '@/components';
import { formatPeso } from '@/lib/money';
import { useTheme } from '@/theme';
import { useSafeToSpend } from '../queries';

/** "Safe to spend today": what is left of today's share of the weekly budget. */
export function SafeToSpendCard() {
  const { colors, radius, spacing } = useTheme();
  const s = useSafeToSpend();
  return (
    <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xs }}>
      <AppText variant="label" tone="muted">
        Safe to spend today
      </AppText>
      {s ? (
        <>
          <AppText variant="amountLarge">{formatPeso(Math.max(0, s.left))}</AppText>
          <AppText variant="caption" tone="secondary">
            {s.left < 0 ? `${formatPeso(-s.left)} over today’s share · ` : ''}
            Daily limit {formatPeso(s.dailyLimit)} · {s.daysLeft} {s.daysLeft === 1 ? 'day' : 'days'} left this {s.period === 'weekly' ? 'week' : 'month'}
          </AppText>
        </>
      ) : (
        <AppText tone="secondary">Add a weekly or monthly budget to see how much you can spend each day.</AppText>
      )}
    </View>
  );
}
