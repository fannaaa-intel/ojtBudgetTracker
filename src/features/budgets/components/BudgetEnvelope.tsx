import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { AppText, Chip, ProgressBar } from '@/components';
import type { BudgetStatus } from '@/lib/budget';
import { formatPeso } from '@/lib/money';
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
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/budgets/[id]', params: { id: String(p.budget.id) } })}
      style={({ pressed }) => ({ paddingVertical: spacing.md, gap: spacing.sm, borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.border, opacity: pressed ? 0.6 : 1 })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <AppText variant="heading" style={{ flex: 1 }}>
          {p.name}
        </AppText>
        <StatusChip status={p.status} />
      </View>
      <ProgressBar pct={p.pct} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <AppText variant="caption" tone="secondary">
          {formatPeso(p.spent)} of {formatPeso(p.available)}
          {p.carry > 0 ? ` (incl. ${formatPeso(p.carry)} carried over)` : ''}
        </AppText>
        <AppText variant="caption" style={{ fontWeight: '600' }}>
          {p.left >= 0 ? `${formatPeso(p.left)} left` : `${formatPeso(-p.left)} over`}
        </AppText>
      </View>
    </Pressable>
  );
}
