import { Stack } from 'expo-router';
import { useStackOptions } from '@/components';

export default function SettingsLayout() {
  return <Stack screenOptions={useStackOptions()} />;
}
