import { Stack } from 'expo-router';
import { useStackOptions } from '@/components';

export default function ReportsLayout() {
  return <Stack screenOptions={useStackOptions()} />;
}
