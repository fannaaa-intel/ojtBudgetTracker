import { router } from 'expo-router';
import { View } from 'react-native';
import { AppText, Button, Logo, Screen } from '@/components';
import { useTheme } from '@/theme';

export default function Welcome() {
  const { spacing } = useTheme();
  return (
    <Screen scroll={false} footer={<Button label="Get started" onPress={() => router.push('/onboarding/register')} />}>
      <View style={{ flex: 1, justifyContent: 'center', gap: spacing.md, paddingTop: spacing.xxl * 2 }}>
        <Logo size={72} />
        <AppText variant="label" tone="muted" style={{ marginTop: spacing.md }}>
          OJT Budget
        </AppText>
        <AppText variant="display">Track every peso of your OJT.</AppText>
        <AppText tone="secondary">
          Pamasahe, pagkain, bills and gala — all offline, on your phone. Register and choose your agency to begin.
        </AppText>
      </View>
    </Screen>
  );
}
