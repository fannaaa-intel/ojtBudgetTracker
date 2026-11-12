import { Stack } from 'expo-router';
import { useStackOptions } from '@/components';

export default function FaresLayout() {
  return <Stack screenOptions={useStackOptions()} />;
}
