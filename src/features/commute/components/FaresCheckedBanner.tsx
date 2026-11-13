import { router } from 'expo-router';
import { View } from 'react-native';
import { AppText, Button, Chip, IconBadge } from '@/components';
import type { Region } from '@/db/schema';
import { formatMonthDayYear } from '@/lib/dates';
import { FARE_CHECK_DAYS } from '@/lib/fareCheck';
import { useTheme } from '@/theme';
import { markFaresChecked, useFareCheck } from '../queries';

/** "Fares last checked: Sept 28, 2026" — the later of the fare table's effective date and your last check. */
export function useFaresCheckedLabel(region: Region | undefined): string | undefined {
  const { last } = useFareCheck(region);
  return last ? `Fares last checked: ${formatMonthDayYear(last)}` : undefined;
}

export function FaresCheckedBanner({ region, showActions = true }: { region: Region; showActions?: boolean }) {
  const { colors, radius, spacing } = useTheme();
  const { last, due } = useFareCheck(region);
  if (!last && !due) return null;
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <IconBadge name="pricetags-outline" size={36} />
        <AppText variant="heading" style={{ flex: 1 }}>
          {last ? `Fares last checked: ${formatMonthDayYear(last)}` : 'Fares not checked yet'}
        </AppText>
        {due ? <Chip label="Check due" status="outline" /> : null}
      </View>
      <AppText variant="caption" tone="secondary">
        {due
          ? `It's been ${FARE_CHECK_DAYS}+ days. Compare with the posted fare matrix.`
          : 'Edit any row that looks off.'}
      </AppText>
      {showActions && due ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button label="Update fares" variant="secondary" onPress={() => router.push('/fares/update')} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Still correct" variant="ghost" onPress={markFaresChecked} />
          </View>
        </View>
      ) : null}
    </View>
  );
}
