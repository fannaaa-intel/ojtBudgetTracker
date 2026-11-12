import Constants from 'expo-constants';
import { router } from 'expo-router';
import { View } from 'react-native';
import { AppText, ListRow, Logo, Screen, Section } from '@/components';
import { BackupRow } from '@/features/backup/BackupRow';
import { RestoreRow } from '@/features/backup/RestoreRow';
import { ExportRows } from '@/features/export/ExportRows';
import { useProfile } from '@/features/profile/queries';
import { featuresFor } from '@/lib/region';
import { useLabels } from '@/store/labels';
import { useTheme } from '@/theme';

export default function More() {
  const { spacing } = useTheme();
  const profile = useProfile();
  const { w } = useLabels();
  return (
    <Screen title="More">
      <Section>
        <ListRow title="OJT hours" subtitle="Worked, WFH, absent, holidays — and unlogged days" onPress={() => router.push('/ojt')} />
        <ListRow title="Grocery list" subtitle="Price memory, price-up notes, rice and staples countdown" onPress={() => router.push('/grocery')} />
        <ListRow title="Essentials" subtitle="Toiletries, laundry, load, health, grooming — runs-out reminders" onPress={() => router.push('/essentials')} />
        <ListRow title="Reports" subtitle="Spending by category, by day and for the whole OJT" onPress={() => router.push('/reports')} />
        <ListRow title="History" subtitle="Every expense and income — edit or delete" onPress={() => router.push('/transactions')} />
        <ListRow title="Income & allowance" subtitle={`${w('baon')}, stipend and pay schedule`} onPress={() => router.push('/income')} />
        <ListRow title={w('utang')} subtitle="Who owes you, who you owe" onPress={() => router.push('/utang')} />
        {profile && featuresFor(profile.user.region).barkada ? (
          <ListRow title={`${w('barkada')} & ${w('ambagan', true)}`} subtitle={`Group ${w('gala', true)}, Christmas party, exchange gift`} onPress={() => router.push('/barkada')} />
        ) : null}
        <ListRow title="Settings" subtitle="Profile, agency, student discount, schedule, appearance" onPress={() => router.push('/settings')} last />
      </Section>
      <Section title="Your data">
        <BackupRow />
        <RestoreRow />
        <ExportRows />
      </Section>
      <View style={{ alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xl }}>
        <Logo size={32} />
        <AppText variant="caption" tone="muted">
          OJT Budget {Constants.expoConfig?.version ?? ''} · works offline
        </AppText>
      </View>
    </Screen>
  );
}
