import { View } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

/** "STEP 2 OF 4" + a thin monochrome progress bar. */
export function StepIndicator({ step, total }: { step: number; total: number }) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="label" tone="muted">
        Step {step} of {total}
      </AppText>
      <View style={{ height: 2, backgroundColor: colors.border }}>
        <View style={{ height: 2, width: `${Math.round((step / total) * 100)}%` as `${number}%`, backgroundColor: colors.inverse }} />
      </View>
    </View>
  );
}
