import { Stack } from 'expo-router';
import { useStackOptions } from '@/components';

export default function EssentialsLayout() {
  return <Stack screenOptions={useStackOptions()} />;
}
