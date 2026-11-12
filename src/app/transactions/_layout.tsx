import { Stack } from 'expo-router';
import { useStackOptions } from '@/components';

export default function TransactionsLayout() {
  return <Stack screenOptions={useStackOptions()} />;
}
