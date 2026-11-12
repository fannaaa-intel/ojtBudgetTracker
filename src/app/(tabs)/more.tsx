import Constants from 'expo-constants';
import { router } from 'expo-router';
import { View } from 'react-native';
import { AppText, ListRow, Logo, Screen, Section } from '@/components';
import { TodoList } from '@/components/TodoList';
import { BackupRow } from '@/features/backup/BackupRow';
import { useTheme } from '@/theme';

export default function More() {
  const { spacing } = useTheme();
  return (
    <Screen title="More">
      <Section>
        <ListRow title="OJT hours" subtitle="Worked, WFH, absent, holidays — and unlogged days" onPress={() => router.push('/ojt')} />
        <ListRow title="Essentials" subtitle="Toiletries, laundry, load, health, grooming — runs-out reminders" onPress={() => router.push('/essentials')} />
        <ListRow title="Reports" subtitle="Spending by category, by day and for the whole OJT" onPress={() => router.push('/reports')} />
        <ListRow title="History" subtitle="Every expense and income — edit or delete" onPress={() => router.push('/transactions')} />
        <ListRow title="Income & allowance" subtitle="Baon, stipend and pay schedule" onPress={() => router.push('/income')} />
        <ListRow title="Settings" subtitle="Profile, agency, student discount, schedule, appearance" onPress={() => router.push('/settings')} last />
      </Section>
      <Section title="Your data">
        <BackupRow last />
      </Section>
      <TodoList phase="Phase 3" items={['Utang & ambagan (Metro Manila barkada only)', 'CSV / PDF OJT cost report', 'Restore backup', 'PIN / fingerprint lock']} />
      <View style={{ alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xl }}>
        <Logo size={32} />
        <AppText variant="caption" tone="muted">
          OJT Budget {Constants.expoConfig?.version ?? ''} · works offline
        </AppText>
      </View>
    </Screen>
  );
}
