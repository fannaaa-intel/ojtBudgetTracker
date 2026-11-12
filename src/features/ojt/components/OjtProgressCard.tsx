import { router } from 'expo-router';
import { View } from 'react-native';
import { AppText, ListRow, ProgressBar, Section } from '@/components';
import { formatDateLabel } from '@/lib/dates';
import { formatPeso } from '@/lib/money';
import { useTheme } from '@/theme';
import { useOjtState } from '../queries';

const fmtHours = (h: number) => `${Number.isInteger(h) ? h : h.toFixed(1)} h`;

/** Hours done vs required, projected end date, cost per day/hour, projected total cost. */
export function OjtProgressCard({ linkToLog = true }: { linkToLog?: boolean }) {
  const { spacing } = useTheme();
  const s = useOjtState();
  if (!s) return null;
  const p = s.projection;

  return (
    <Section title="OJT progress">
      <View style={{ paddingVertical: spacing.md, gap: spacing.sm }}>
        {s.requiredHours ? (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <AppText variant="amount">
                {fmtHours(s.hoursDone)} of {s.requiredHours} h
              </AppText>
              <AppText variant="caption" tone="secondary">{p.pctDone ?? 0}%</AppText>
            </View>
            <ProgressBar pct={p.pctDone ?? 0} />
            <AppText variant="caption" tone="secondary">
              {p.remainingHours === 0
                ? 'Required hours complete.'
                : p.endDate
                  ? `${fmtHours(p.remainingHours ?? 0)} left · ends about ${formatDateLabel(p.endDate)} (${p.workdaysLeft} workdays)`
                  : 'Could not project an end date — check your hours per day.'}
            </AppText>
          </>
        ) : (
          <AppText tone="secondary">Add your required OJT hours in Settings to see your end date and total cost.</AppText>
        )}
      </View>
      <ListRow title="Spent since OJT started" value={formatPeso(s.totalSpent)} />
      <ListRow title="Cost per OJT day" subtitle="One-time items left out" value={p.costPerDay != null ? formatPeso(p.costPerDay) : '—'} />
      <ListRow title="Cost per OJT hour" value={p.costPerHour != null ? formatPeso(p.costPerHour) : '—'} />
      <ListRow
        title="Projected total to finish"
        subtitle={p.projectedTotal == null ? (s.requiredHours ? 'Log a worked day to estimate' : 'Needs required hours') : undefined}
        value={p.projectedTotal != null ? formatPeso(p.projectedTotal) : '—'}
        onPress={linkToLog ? () => router.push('/ojt') : undefined}
        last
      />
    </Section>
  );
}
