import { Stack } from 'expo-router';
import { useStackOptions } from '@/components';

export default function BudgetsLayout() {
  return <Stack screenOptions={useStackOptions()} />;
}
