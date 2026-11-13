import { router } from 'expo-router';
import { View } from 'react-native';
import { AnimatedAmount, AppText, ListRow, ProgressBar, Section } from '@/components';
import { formatDateLabel } from '@/lib/dates';
import { formatPeso } from '@/lib/money';
import { useTheme } from '@/theme';
import { useOjtState } from '../queries';

const fmtHours = (h: number) => `${Number.isInteger(h) ? h : h.toFixed(1)} h`;

/**
 * Hours done vs required (counting up) and the projected end date.
 * `compact` (Home): just that, plus a link to the OJT screen.
 * Full (OJT screen): also total spent, cost per day / hour and projected total.
 */
export function OjtProgressCard({ compact = false }: { compact?: boolean }) {
  const { spacing } = useTheme();
  const s = useOjtState();
  if (!s) return null;
  const p = s.projection;

  return (
    <Section title="OJT progress" icon="hourglass-outline">
      <View style={{ paddingVertical: spacing.lg, gap: spacing.md }}>
        {s.requiredHours ? (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: spacing.md }}>
              <AnimatedAmount value={s.hoursDone} integer={false} format={fmtHours} variant="amountLarge" />
              <AppText tone="secondary">of {s.requiredHours} h</AppText>
            </View>
            <ProgressBar pct={p.pctDone ?? 0} height={8} />
            <AppText variant="caption" tone="secondary">
              {p.remainingHours === 0
                ? 'Required hours complete.'
                : p.endDate
                  ? `Ends about ${formatDateLabel(p.endDate)}`
                  : 'Could not project an end date. Check your hours per day.'}
            </AppText>
            {p.remainingHours && p.endDate ? (
              <AppText variant="caption" tone="muted">
                {fmtHours(p.remainingHours)} left, {p.workdaysLeft} workdays
              </AppText>
            ) : null}
          </>
        ) : (
          <AppText tone="secondary">Add your required hours in Settings to see your end date.</AppText>
        )}
      </View>
      {compact ? (
        <ListRow title="Cost of your OJT" subtitle="Per day, per hour and to finish" onPress={() => router.push('/ojt')} last />
      ) : (
        <>
          <ListRow title="Spent since OJT started" value={formatPeso(s.totalSpent)} />
          <ListRow title="Cost per OJT day" subtitle="One-time items left out" value={p.costPerDay != null ? formatPeso(p.costPerDay) : '—'} />
          <ListRow title="Cost per OJT hour" value={p.costPerHour != null ? formatPeso(p.costPerHour) : '—'} />
          <ListRow
            title="Projected total to finish"
            subtitle={p.projectedTotal == null ? (s.requiredHours ? 'Log a worked day to estimate' : 'Needs required hours') : undefined}
            value={p.projectedTotal != null ? formatPeso(p.projectedTotal) : '—'}
            last
          />
        </>
      )}
    </Section>
  );
}
