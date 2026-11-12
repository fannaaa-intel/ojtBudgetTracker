import { Stack } from 'expo-router';
import { useStackOptions } from '@/components';

export default function SavingsLayout() {
  return <Stack screenOptions={useStackOptions()} />;
}
