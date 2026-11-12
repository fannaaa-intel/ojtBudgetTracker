import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { AppText, Chip, ProgressBar } from '@/components';
import type { BudgetStatus } from '@/lib/budget';
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

export function BudgetEnvelope({ p, last }: { p: BudgetProgress; last?: boolean }) {
  const { colors, spacing } = useTheme();
  const { cat } = useLabels();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/budgets/[id]', params: { id: String(p.budget.id) } })}
      style={({ pressed }) => ({ paddingVertical: spacing.md, gap: spacing.sm, borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.border, opacity: pressed ? 0.6 : 1 })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <AppText variant="heading" numberOfLines={2}>
            {cat(p.categoryKey, p.name)}
          </AppText>
          <StatusChip status={p.status} />
        </View>
        <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
          <AppText variant="amount">{formatPeso(Math.abs(p.left))}</AppText>
          <AppText variant="caption" tone="secondary">
            {p.left >= 0 ? 'left' : 'over'}
          </AppText>
        </View>
      </View>
      <ProgressBar pct={p.pct} />
      <AppText variant="caption" tone="secondary">
        {formatPeso(p.spent)} spent of {formatPeso(p.available)}
        {p.carry > 0 ? ` · includes ${formatPeso(p.carry)} carried over` : ''}
      </AppText>
    </Pressable>
  );
}
