import { Stack } from 'expo-router';
import { useStackOptions } from '@/components';

export default function GalaLayout() {
  return <Stack screenOptions={useStackOptions()} />;
}
