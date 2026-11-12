import { router } from 'expo-router';
import { ListRow, Screen, Section } from '@/components';
import { TodoList } from '@/components/TodoList';
import { BackupRow } from '@/features/backup/BackupRow';

export default function More() {
  return (
    <Screen title="More">
      <Section>
        <ListRow title="History" subtitle="Every expense and income — edit or delete" onPress={() => router.push('/transactions')} />
        <ListRow title="Income & allowance" subtitle="Baon, stipend and pay schedule" onPress={() => router.push('/income')} />
        <ListRow title="Settings" subtitle="Profile, agency, student discount, schedule, appearance" onPress={() => router.push('/settings')} last />
      </Section>
      <Section title="Your data">
        <BackupRow last />
      </Section>
      <TodoList phase="Phase 2" items={['OJT hours log + projected end date', 'Reports by category / period', 'Essentials & restock reminders']} />
      <TodoList phase="Phase 3" items={['Utang & ambagan (Metro Manila barkada only)', 'CSV / PDF OJT cost report', 'Restore backup', 'PIN / fingerprint lock']} />
    </Screen>
  );
}
