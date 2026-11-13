import { useState } from 'react';
import { View } from 'react-native';
import { AnimatedAmount, Appear, AppText, BarChart, Chip, ChipRow, EmptyState, HBarRow, IconBadge, ListRow, Screen, Section } from '@/components';
import { ExportRows } from '@/features/export/ExportRows';
import { useReport } from '@/features/reports/queries';
import { formatDateLabel } from '@/lib/dates';
import { formatPeso } from '@/lib/money';
import { barFractions, highlightIndex, REPORT_PERIOD_LABEL, type ReportPeriod } from '@/lib/reports';
import { useLabels } from '@/store/labels';
import { useTheme } from '@/theme';

const PERIODS: ReportPeriod[] = ['week', 'month', 'ojt'];

/** Spending by category and over time. Greys only; the biggest bar is the one strong mark. */
export default function Reports() {
  const { colors, radius, spacing } = useTheme();
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const r = useReport(period);
  const { cat, w } = useLabels();
  const catFractions = barFractions(r.categories.map((c) => c.amount));
  const top = r.series[highlightIndex(r.series.map((p) => p.amount))];

  return (
    <Screen insetTop={false} title="Reports" subtitle={`${formatDateLabel(r.from)} – ${formatDateLabel(r.to)}`}>
      <ChipRow>
        {PERIODS.map((p) => (
          <Chip key={p} label={REPORT_PERIOD_LABEL[p]} selected={period === p} onPress={() => setPeriod(p)} />
        ))}
      </ChipRow>

      <Appear grow>
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <AppText variant="label" tone="muted">
              Spent in {r.days} {r.days === 1 ? 'day' : 'days'}
            </AppText>
            <IconBadge name="analytics-outline" size={36} />
          </View>
          <AnimatedAmount value={r.total} variant="amountLarge" />
          <AppText variant="caption" tone="secondary">
            {formatPeso(r.avgPerDay)} a day on average
          </AppText>
          {r.oneTime > 0 ? (
            <AppText variant="caption" tone="muted">
              Includes {formatPeso(r.oneTime)} one-time
            </AppText>
          ) : null}
        </View>
      </Appear>

      <Appear index={1}>
        <Section title={r.series.length > 31 || r.days > 31 ? 'By week' : 'By day'} icon="bar-chart-outline">
          {r.total > 0 ? (
            <View style={{ paddingVertical: spacing.lg, gap: spacing.md }}>
              <BarChart points={r.series} accessibilityLabel={top ? `Highest: ${top.label}, ${formatPeso(top.amount)}` : 'No spending'} />
              {top ? (
                <AppText variant="caption" tone="secondary">
                  Highest: {top.label}, {formatPeso(top.amount)}
                </AppText>
              ) : null}
            </View>
          ) : (
            <EmptyState icon="bar-chart-outline" message="No spending in this period yet." />
          )}
        </Section>
      </Appear>

      {r.categories.length > 0 ? (
        <Appear index={2}>
          <Section title="By category" icon="pie-chart-outline">
            <View key={period} style={{ paddingVertical: spacing.md, gap: spacing.xs }}>
              {r.categories.map((c, i) => (
                <HBarRow key={c.key} index={i} name={cat(c.key, c.name)} value={formatPeso(c.amount)} pct={c.pct} fraction={catFractions[i]} strong={i === 0} />
              ))}
            </View>
          </Section>
        </Appear>
      ) : null}

      <Appear index={3}>
        <Section title={`Needs vs ${w('gala', true)}`} icon="scale-outline">
          <ListRow icon="home-outline" title="Needs" subtitle={`${w('pamasahe')}, ${w('pagkain', true)}, bills`} value={formatPeso(r.needs)} />
          <ListRow icon="sparkles-outline" title={w('gala')} subtitle="Outings, gifts, events" value={formatPeso(r.gala)} last />
        </Section>
      </Appear>
      <AppText variant="caption" tone="muted">
        Savings transfers are not spending.
      </AppText>
      <Appear index={4}>
        <Section title="Export" icon="share-outline">
          <ExportRows />
        </Section>
      </Appear>
    </Screen>
  );
}
