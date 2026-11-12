import { Stack } from 'expo-router';
import { useStackOptions } from '@/components';

export default function RoutesLayout() {
  return <Stack screenOptions={useStackOptions()} />;
}
