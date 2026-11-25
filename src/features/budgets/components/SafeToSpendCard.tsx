import type { ReactNode } from 'react';
import { View } from 'react-native';
import { AnimatedAmount, AppText, IconBadge } from '@/components';
import { formatPeso } from '@/lib/money';
import { useTheme } from '@/theme';
import { useSafeToSpend } from '../queries';

const DAYS_LEFT_LABEL = { duty: 'Duty days left', week: 'Days left this week', month: 'Days left this month' } as const;

/** One caption over one amount, side by side with its neighbour. */
function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <AppText variant="caption" tone="secondary">
        {label}
      </AppText>
      {children}
    </View>
  );
}

/**
 * "Safe to spend today": what is left of today's share of the budget. One fact per line.
 * On a weekend / day off with a duty-days budget there is no fixed limit: it shows what was
 * spent on days off and what is left of the duty budget instead.
 */
export function SafeToSpendCard() {
  const { colors, radius, spacing } = useTheme();
  const s = useSafeToSpend();
  return (
    <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}>
        <AppText variant="label" tone="muted">
          {s?.kind === 'off_day' ? 'Day off today' : 'Safe to spend today'}
        </AppText>
        <IconBadge name={s?.kind === 'off_day' ? 'sunny-outline' : 'shield-checkmark-outline'} size={36} />
      </View>
      {s?.kind === 'limit' ? (
        <>
          <AnimatedAmount value={Math.max(0, s.left)} variant="amountLarge" />
          {s.left < 0 ? <AppText variant="caption">{formatPeso(-s.left)} over today’s share</AppText> : null}
          <View style={{ flexDirection: 'row', gap: spacing.lg }}>
            <Fact label="Daily limit">
              <AppText variant="amount">{formatPeso(s.dailyLimit)}</AppText>
            </Fact>
            <Fact label={DAYS_LEFT_LABEL[s.daysLabel]}>
              <AppText variant="amount">{s.daysLeft}</AppText>
            </Fact>
          </View>
        </>
      ) : s?.kind === 'off_day' ? (
        <>
          <AppText variant="heading">No fixed limit</AppText>
          <AppText variant="caption" tone="secondary">
            Your weekly budget covers duty days only. Weekend spending varies.
          </AppText>
          <View style={{ flexDirection: 'row', gap: spacing.lg }}>
            <Fact label="Spent on days off">
              <AppText variant="amount">{formatPeso(s.offDaySpent)}</AppText>
            </Fact>
            <Fact label={s.dutyLeft >= 0 ? 'Left of duty budget' : 'Duty budget over'}>
              <AppText variant="amount">{formatPeso(Math.abs(s.dutyLeft))}</AppText>
            </Fact>
          </View>
        </>
      ) : (
        <AppText tone="secondary">Add a budget to see how much you can spend each day.</AppText>
      )}
    </View>
  );
}
