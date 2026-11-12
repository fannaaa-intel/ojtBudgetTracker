import { router } from 'expo-router';
import { View } from 'react-native';
import { AppText, Button, OptionRow, Screen, StepIndicator, TextField } from '@/components';
import { isValidName } from '@/lib/profile';
import { useOnboarding } from '@/store/onboarding';
import { useTheme } from '@/theme';

export default function Register() {
  const { spacing } = useTheme();
  const d = useOnboarding();
  const canContinue = isValidName(d.name);

  return (
    <Screen
      insetTop={false}
      title="Register"
      subtitle="Your profile stays on this phone. No account or internet needed."
      footer={<Button label="Continue" disabled={!canContinue} onPress={() => router.push('/onboarding/agency')} />}
    >
      <StepIndicator step={1} total={4} />
      <TextField label="Full name" value={d.name} onChangeText={(name) => d.set({ name })} placeholder="Juan Dela Cruz" autoCapitalize="words" />
      <TextField label="Nickname (optional)" value={d.nickname} onChangeText={(nickname) => d.set({ nickname })} placeholder="Juan" />
      <TextField label="School" value={d.school} onChangeText={(school) => d.set({ school })} placeholder="Your university" />
      <TextField label="Course" value={d.course} onChangeText={(course) => d.set({ course })} placeholder="BS Information Technology" />
      <View style={{ gap: spacing.sm }}>
        <AppText variant="label" tone="secondary">
          Student fare discount
        </AppText>
        <OptionRow title="Yes, I have a valid school ID" subtitle="20% off jeeps and buses, 50% off LRT/MRT single tickets" selected={d.isStudent} onPress={() => d.set({ isStudent: true })} />
        <OptionRow title="No" selected={!d.isStudent} onPress={() => d.set({ isStudent: false })} />
      </View>
    </Screen>
  );
}
