import { Stack } from 'expo-router';
import { useStackOptions } from '@/components';

export default function WalletsLayout() {
  return <Stack screenOptions={useStackOptions()} />;
}
