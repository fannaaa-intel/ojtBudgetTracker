import { useState } from 'react';
import { View } from 'react-native';
import { AppText, BarChart, Chip, ChipRow, HBarRow, ListRow, Screen, Section } from '@/components';
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
    <Screen insetTop={false} title="Reports" subtitle={`${formatDateLabel(r.from)} – ${formatDateLabel(r.to)} · ${r.days} ${r.days === 1 ? 'day' : 'days'}`}>
      <ChipRow>
        {PERIODS.map((p) => (
          <Chip key={p} label={REPORT_PERIOD_LABEL[p]} selected={period === p} onPress={() => setPeriod(p)} />
        ))}
      </ChipRow>

      <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xs }}>
        <AppText variant="label" tone="muted">
          Spent
        </AppText>
        <AppText variant="amountLarge">{formatPeso(r.total)}</AppText>
        <AppText variant="caption" tone="secondary">
          {formatPeso(r.avgPerDay)} a day on average{r.oneTime > 0 ? ` · ${formatPeso(r.oneTime)} one-time` : ''}
        </AppText>
      </View>

      <Section title={r.series.length > 31 || r.days > 31 ? 'By week' : 'By day'}>
        <View style={{ paddingVertical: spacing.lg }}>
          {r.total > 0 ? (
            <BarChart points={r.series} accessibilityLabel={top ? `Highest: ${top.label}, ${formatPeso(top.amount)}` : 'No spending'} />
          ) : (
            <AppText tone="secondary">No spending in this period yet.</AppText>
          )}
          {top ? (
            <AppText variant="caption" tone="secondary" style={{ marginTop: spacing.sm }}>
              Highest: {top.label} · {formatPeso(top.amount)}
            </AppText>
          ) : null}
        </View>
      </Section>

      {r.categories.length > 0 ? (
        <Section title="By category">
          <View style={{ paddingVertical: spacing.md, gap: spacing.xs }}>
            {r.categories.map((c, i) => (
              <HBarRow key={c.key} name={cat(c.key, c.name)} value={formatPeso(c.amount)} pct={c.pct} fraction={catFractions[i]} strong={i === 0} />
            ))}
          </View>
        </Section>
      ) : null}

      <Section title={`Needs vs ${w('gala', true)}`}>
        <ListRow title="Needs" subtitle={`${w('pamasahe')}, ${w('pagkain', true)}, bills, essentials`} value={formatPeso(r.needs)} />
        <ListRow title={w('gala')} subtitle="Outings, gifts and events" value={formatPeso(r.gala)} last />
      </Section>
      <AppText variant="caption" tone="muted">Savings transfers are not spending and are not shown here.</AppText>
      <Section title="Export">
        <ExportRows />
      </Section>
    </Screen>
  );
}
