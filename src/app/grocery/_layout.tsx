import { Stack } from 'expo-router';
import { useStackOptions } from '@/components';

export default function GroceryLayout() {
  return <Stack screenOptions={useStackOptions()} />;
}
