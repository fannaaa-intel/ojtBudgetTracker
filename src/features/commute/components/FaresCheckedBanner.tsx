import { View } from 'react-native';
import { AppText } from '@/components';
import type { Region } from '@/db/schema';
import { useDbQuery } from '@/db/useDbQuery';
import { formatMonthDayYear } from '@/lib/dates';
import { useTheme } from '@/theme';
import { faresLastChecked } from '../queries';

/** "Fares last checked: Sept 28, 2026" — date read from fare_rules, never hardcoded. */
export function useFaresCheckedLabel(region: Region | undefined): string | undefined {
  const d = useDbQuery(() => (region ? faresLastChecked(region) : null), ['fare_rules'], [region]);
  return d ? `Fares last checked: ${formatMonthDayYear(d)}` : undefined;
}

export function FaresCheckedBanner({ region }: { region: Region }) {
  const { colors, radius, spacing } = useTheme();
  const label = useFaresCheckedLabel(region);
  if (!label) return null;
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: 2 }}>
      <AppText variant="heading">{label}</AppText>
      <AppText variant="caption" tone="secondary">
        Check the posted fare matrix if it looks off, and edit any row. Past entries keep what you paid.
      </AppText>
    </View>
  );
}
