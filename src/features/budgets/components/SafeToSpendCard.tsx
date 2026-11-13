import { View } from 'react-native';
import { AnimatedAmount, AppText, IconBadge } from '@/components';
import { formatPeso } from '@/lib/money';
import { useTheme } from '@/theme';
import { useSafeToSpend } from '../queries';

/** "Safe to spend today": what is left of today's share of the budget. One fact per line. */
export function SafeToSpendCard() {
  const { colors, radius, spacing } = useTheme();
  const s = useSafeToSpend();
  return (
    <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}>
        <AppText variant="label" tone="muted">
          Safe to spend today
        </AppText>
        <IconBadge name="shield-checkmark-outline" size={36} />
      </View>
      {s ? (
        <>
          <AnimatedAmount value={Math.max(0, s.left)} variant="amountLarge" />
          {s.left < 0 ? <AppText variant="caption">{formatPeso(-s.left)} over today’s share</AppText> : null}
          <View style={{ flexDirection: 'row', gap: spacing.lg }}>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="caption" tone="secondary">
                Daily limit
              </AppText>
              <AppText variant="amount">{formatPeso(s.dailyLimit)}</AppText>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="caption" tone="secondary">
                Days left this {s.period === 'weekly' ? 'week' : 'month'}
              </AppText>
              <AppText variant="amount">{s.daysLeft}</AppText>
            </View>
          </View>
        </>
      ) : (
        <AppText tone="secondary">Add a budget to see how much you can spend each day.</AppText>
      )}
    </View>
  );
}
