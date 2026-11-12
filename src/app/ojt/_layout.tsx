import { Stack } from 'expo-router';
import { useStackOptions } from '@/components';

export default function OjtLayout() {
  return <Stack screenOptions={useStackOptions()} />;
}
