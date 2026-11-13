import { router } from 'expo-router';
import { View } from 'react-native';
import { AnimatedAmount, Appear, AppText, ListRow, Screen, Section } from '@/components';
import { CommuteQuickLog } from '@/features/commute/components/CommuteQuickLog';
import { MealPresetChips } from '@/features/meals/components/MealPresetChips';
import { useFoodSpentToday } from '@/features/meals/queries';
import { useProfile } from '@/features/profile/queries';
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
      <Appear>
        <Section title={w('pagkain')} icon="restaurant-outline">
          <View style={{ paddingVertical: spacing.lg, gap: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.md }}>
              <AppText variant="caption" tone="secondary">
                Today so far
              </AppText>
              <AnimatedAmount value={foodToday} />
            </View>
            <MealPresetChips region={profile.user.region} userId={profile.user.id} />
          </View>
        </Section>
      </Appear>

      <Appear index={1}>
        <Section title={w('pamasahe')} icon="bus-outline">
          <View style={{ paddingVertical: spacing.lg }}>
            <CommuteQuickLog />
          </View>
        </Section>
      </Appear>

      <Appear index={2}>
        <Section title="Something else" icon="create-outline">
          <ListRow icon="remove-circle-outline" title="Add expense" subtitle="Any category, any day" onPress={() => router.push({ pathname: '/transactions/new', params: { kind: 'expense' } })} />
          <ListRow icon="add-circle-outline" title="Add income" subtitle={`${w('baon')}, stipend, padala`} onPress={() => router.push({ pathname: '/transactions/new', params: { kind: 'income' } })} last />
        </Section>
      </Appear>
    </Screen>
  );
}
