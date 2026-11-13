import { Animated, View } from 'react-native';
import { barScale } from '@/lib/motion';
import { useTheme } from '@/theme';
import { useGrow } from './useGrow';

type Props = {
  /** 0–100. */
  pct: number;
  /** Track height in px. */
  height?: number;
  /** Bar on an inverse card: light fill on a dimmed track. */
  onInverse?: boolean;
  /** Grey fill instead of the inverse fill (secondary rows in a chart). */
  quiet?: boolean;
  delay?: number;
};

/** Thin monochrome bar: grey track, inverse fill that grows to its value. */
export function ProgressBar({ pct, height = 6, onInverse, quiet, delay }: Props) {
  const { colors, radius } = useTheme();
  const scale = useGrow(barScale(pct), delay);
  const w = Math.round(barScale(pct) * 100);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: w }}
      style={{ height, borderRadius: radius.pill, backgroundColor: onInverse ? colors.textSecondary : colors.surfaceAlt, overflow: 'hidden', opacity: onInverse ? 0.9 : 1 }}
    >
      <Animated.View
        style={{
          height,
          width: '100%',
          backgroundColor: onInverse ? colors.onInverse : quiet ? colors.textMuted : colors.inverse,
          transformOrigin: 'left',
          transform: [{ scaleX: scale }],
        }}
      />
    </View>
  );
}
