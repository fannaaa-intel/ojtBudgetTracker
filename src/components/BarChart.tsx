import { View } from 'react-native';
import { barFractions, highlightIndex } from '@/lib/reports';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

type Props = {
  points: { key: string; label: string; amount: number }[];
  height?: number;
  /** Spoken summary for screen readers, e.g. "Highest: Mon ₱200". */
  accessibilityLabel: string;
};

/**
 * Vertical bars, greys only. The single largest bar is drawn in the inverse colour
 * (black on light, white on dark); every other bar is grey. Labels are thinned when crowded.
 */
export function BarChart({ points, height = 120, accessibilityLabel }: Props) {
  const { colors, spacing } = useTheme();
  const values = points.map((p) => p.amount);
  const fractions = barFractions(values);
  const hi = highlightIndex(values);
  const every = points.length > 16 ? Math.ceil(points.length / 8) : 1;

  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={{ gap: spacing.xs }}>
      <View style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap: points.length > 20 ? 2 : 4, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        {points.map((p, i) => (
          <View key={p.key} style={{ flex: 1, height: '100%', justifyContent: 'flex-end' }}>
            <View
              style={{
                height: `${Math.round(fractions[i] * 100)}%`,
                minHeight: fractions[i] > 0 ? 2 : 0,
                borderTopLeftRadius: 3,
                borderTopRightRadius: 3,
                backgroundColor: i === hi ? colors.inverse : colors.textMuted,
                opacity: i === hi ? 1 : 0.45,
              }}
            />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: points.length > 20 ? 2 : 4 }}>
        {points.map((p, i) => (
          <AppText key={p.key} variant="caption" tone={i === hi ? 'default' : 'muted'} numberOfLines={1} style={{ flex: 1, textAlign: 'center', fontSize: 10 }}>
            {i % every === 0 ? p.label : ''}
          </AppText>
        ))}
      </View>
    </View>
  );
}

/** One horizontal bar row: name, amount, percentage; the strongest row uses the inverse colour. */
export function HBarRow({ name, value, pct, fraction, strong }: { name: string; value: string; pct: number; fraction: number; strong?: boolean }) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.xs, paddingVertical: spacing.xs }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
        <AppText style={{ flex: 1, fontWeight: strong ? '600' : '400' }} numberOfLines={1}>
          {name}
        </AppText>
        <AppText variant="caption" tone="secondary">
          {pct}%
        </AppText>
        <AppText variant="amount" style={{ fontSize: 15 }}>
          {value}
        </AppText>
      </View>
      <View style={{ height: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}>
        <View style={{ height: 6, width: `${Math.round(fraction * 100)}%`, backgroundColor: strong ? colors.inverse : colors.textMuted }} />
      </View>
    </View>
  );
}
