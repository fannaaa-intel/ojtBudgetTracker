import { Stack } from 'expo-router';
import { useStackOptions } from '@/components';

export default function BarkadaLayout() {
  return <Stack screenOptions={useStackOptions()} />;
}
