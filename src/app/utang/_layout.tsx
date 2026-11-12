import { Stack } from 'expo-router';
import { useStackOptions } from '@/components';

export default function UtangLayout() {
  return <Stack screenOptions={useStackOptions()} />;
}
