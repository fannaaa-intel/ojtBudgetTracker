import { router } from 'expo-router';
import { Animated, Pressable, View } from 'react-native';
import { AnimatedAmount, AppText, Chip, ProgressBar } from '@/components';
import { usePressScale } from '@/components/usePressScale';
import type { BudgetStatus } from '@/lib/budget';
import { staggerDelay } from '@/lib/motion';
import { formatPeso } from '@/lib/money';
import { useLabels } from '@/store/labels';
import { useTheme } from '@/theme';
import type { BudgetProgress } from '../queries';

/** OVER = inverse chip (100%+), near limit = outlined chip (80%+), ok = nothing. */
export function StatusChip({ status, onInverse }: { status: BudgetStatus; onInverse?: boolean }) {
  if (status === 'over') return <Chip label="Over" status="inverse" onInverse={onInverse} accessibilityLabel="Over budget" />;
  if (status === 'near') return <Chip label="Near limit" status="outline" onInverse={onInverse} accessibilityLabel="Near the limit, 80 percent or more used" />;
  return null;
}

export function BudgetEnvelope({ p, last, index = 0 }: { p: BudgetProgress; last?: boolean; index?: number }) {
  const { colors, spacing } = useTheme();
  const { cat } = useLabels();
  const press = usePressScale(0.98);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/budgets/[id]', params: { id: String(p.budget.id) } })}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={{ borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.border }}
    >
      {({ pressed }) => (
        <Animated.View style={[{ paddingVertical: spacing.lg, gap: spacing.md, opacity: pressed ? 0.7 : 1 }, press.style]}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
            <View style={{ flex: 1, gap: spacing.xs }}>
              <AppText variant="heading" numberOfLines={2}>
                {cat(p.categoryKey, p.name)}
              </AppText>
              <StatusChip status={p.status} />
            </View>
            <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
              <AnimatedAmount value={Math.abs(p.left)} />
              <AppText variant="caption" tone="secondary">
                {p.left >= 0 ? 'left' : 'over'}
              </AppText>
            </View>
          </View>
          <ProgressBar pct={p.pct} delay={staggerDelay(index)} />
          <AppText variant="caption" tone="secondary">
            {formatPeso(p.spent)} of {formatPeso(p.available)}
          </AppText>
          {p.carry > 0 ? (
            <AppText variant="caption" tone="muted">
              Includes {formatPeso(p.carry)} carried over
            </AppText>
          ) : null}
        </Animated.View>
      )}
    </Pressable>
  );
}
