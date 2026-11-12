import { View } from 'react-native';
import { useTheme } from '@/theme';

/** Thin monochrome bar: grey track, inverse fill. pct is 0–100. */
export function ProgressBar({ pct }: { pct: number }) {
  const { colors, radius } = useTheme();
  const w = Math.max(0, Math.min(100, pct));
  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: w }} style={{ height: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}>
      <View style={{ height: 6, width: `${w}%`, backgroundColor: colors.inverse }} />
    </View>
  );
}
