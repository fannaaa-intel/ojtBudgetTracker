import { Stack } from 'expo-router';
import { useStackOptions } from '@/components';

export default function IncomeLayout() {
  return <Stack screenOptions={useStackOptions()} />;
}
