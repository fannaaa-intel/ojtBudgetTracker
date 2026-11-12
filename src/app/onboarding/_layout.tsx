import { Stack } from 'expo-router';
import { useStackOptions } from '@/components';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={useStackOptions()}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
