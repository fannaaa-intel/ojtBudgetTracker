import { Animated, View } from 'react-native';
import { barFractions, highlightIndex } from '@/lib/reports';
import { staggerDelay } from '@/lib/motion';
import { useTheme } from '@/theme';
import { AppText } from './AppText';
import { ProgressBar } from './ProgressBar';
import { useGrow } from './useGrow';

type Point = { key: string; label: string; amount: number };
type Props = {
  points: Point[];
  height?: number;
  /** Spoken summary for screen readers, e.g. "Highest: Mon ₱200". */
  accessibilityLabel: string;
};

/** One bar; grows up from the baseline with a short left-to-right stagger. */
function Bar({ fraction, strong, index }: { fraction: number; strong: boolean; index: number }) {
  const { colors } = useTheme();
  const grow = useGrow(1, staggerDelay(index) / 2);
  return (
    <View style={{ flex: 1, height: '100%', justifyContent: 'flex-end' }}>
      <Animated.View
        style={{
          height: `${Math.round(fraction * 100)}%`,
          minHeight: fraction > 0 ? 2 : 0,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          backgroundColor: strong ? colors.inverse : colors.textMuted,
          opacity: strong ? 1 : 0.45,
          transformOrigin: 'bottom',
          transform: [{ scaleY: grow }],
        }}
      />
    </View>
  );
}

/**
 * Vertical bars, greys only. The single largest bar is drawn in the inverse colour
 * (black on light, white on dark); every other bar is grey. Labels are thinned when crowded.
 * Bars grow in when the chart appears and again whenever the data changes (e.g. a new period).
 */
export function BarChart({ points, height = 120, accessibilityLabel }: Props) {
  const { colors, spacing } = useTheme();
  const values = points.map((p) => p.amount);
  const fractions = barFractions(values);
  const hi = highlightIndex(values);
  const every = points.length > 16 ? Math.ceil(points.length / 8) : 1;
  const gap = points.length > 20 ? 2 : 4;
  const signature = points.map((p) => `${p.key}:${p.amount}`).join('|');

  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={{ gap: spacing.sm }}>
      <View key={signature} style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        {points.map((p, i) => (
          <Bar key={p.key} fraction={fractions[i]} strong={i === hi} index={i} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap }}>
        {points.map((p, i) => (
          <AppText key={p.key} variant="caption" tone={i === hi ? 'default' : 'muted'} numberOfLines={1} style={{ flex: 1, textAlign: 'center', fontSize: 11 }}>
            {i % every === 0 ? p.label : ''}
          </AppText>
        ))}
      </View>
    </View>
  );
}

/** One horizontal bar row: name + amount on one line, share and bar below; the strongest row uses the inverse colour. */
export function HBarRow({ name, value, pct, fraction, strong, index = 0 }: { name: string; value: string; pct: number; fraction: number; strong?: boolean; index?: number }) {
  const { spacing } = useTheme();
  return (
    <View accessible accessibilityLabel={`${name}, ${value}, ${pct} percent`} style={{ gap: spacing.sm, paddingVertical: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.md }}>
        <AppText style={{ flex: 1, fontWeight: strong ? '600' : '400' }} numberOfLines={2}>
          {name}
        </AppText>
        <AppText variant="amount" style={{ fontSize: 15, flexShrink: 0 }}>
          {value}
        </AppText>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <ProgressBar pct={fraction * 100} quiet={!strong} delay={staggerDelay(index)} />
        </View>
        <AppText variant="caption" tone="secondary" style={{ minWidth: 36, textAlign: 'right' }}>
          {pct}%
        </AppText>
      </View>
    </View>
  );
}
