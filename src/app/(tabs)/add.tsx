import { router } from 'expo-router';
import { View } from 'react-native';
import { AppText, Button, Screen, Section } from '@/components';
import { CommuteQuickLog } from '@/features/commute/components/CommuteQuickLog';
import { MealPresetChips } from '@/features/meals/components/MealPresetChips';
import { useFoodSpentToday } from '@/features/meals/queries';
import { useProfile } from '@/features/profile/queries';
import { formatPeso } from '@/lib/money';
import { useLabels } from '@/store/labels';
import { useTheme } from '@/theme';

/** Fast logging: one-tap meals, one-tap commute, then the full expense / income forms. */
export default function Add() {
  const { spacing } = useTheme();
  const profile = useProfile();
  const foodToday = useFoodSpentToday();
  const { w } = useLabels();
  if (!profile) return null;

  return (
    <Screen title="Add" subtitle="Log in seconds.">
      <Section title={`${w('pagkain')} — one tap`} action={<AppText variant="caption" tone="secondary">Today {formatPeso(foodToday)}</AppText>}>
        <View style={{ paddingVertical: spacing.lg }}>
          <MealPresetChips region={profile.user.region} userId={profile.user.id} />
        </View>
      </Section>

      <Section title={w('pamasahe')}>
        <View style={{ paddingVertical: spacing.lg }}>
          <CommuteQuickLog />
        </View>
      </Section>

      <View style={{ gap: spacing.sm }}>
        <Button label="Add expense" variant="secondary" onPress={() => router.push({ pathname: '/transactions/new', params: { kind: 'expense' } })} />
        <Button label="Add income" variant="secondary" onPress={() => router.push({ pathname: '/transactions/new', params: { kind: 'income' } })} />
      </View>
    </Screen>
  );
}
