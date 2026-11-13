import Constants from 'expo-constants';
import { router } from 'expo-router';
import { View } from 'react-native';
import { Appear, AppText, ListRow, Logo, Screen, Section } from '@/components';
import { BackupRow } from '@/features/backup/BackupRow';
import { RestoreRow } from '@/features/backup/RestoreRow';
import { ExportRows } from '@/features/export/ExportRows';
import { useProfile } from '@/features/profile/queries';
import { featuresFor } from '@/lib/region';
import { useLabels } from '@/store/labels';
import { useTheme } from '@/theme';

/** More: every other screen. Icon + title + one short line per row. */
export default function More() {
  const { spacing } = useTheme();
  const profile = useProfile();
  const { w } = useLabels();
  const barkada = !!profile && featuresFor(profile.user.region).barkada;
  return (
    <Screen title="More">
      <Appear>
        <Section title="Track" icon="layers-outline">
          <ListRow icon="time-outline" title="OJT hours" subtitle="Your log and cost" onPress={() => router.push('/ojt')} />
          <ListRow icon="bar-chart-outline" title="Reports" subtitle="Where your money goes" onPress={() => router.push('/reports')} />
          <ListRow icon="receipt-outline" title="History" subtitle="Every entry, edit or delete" onPress={() => router.push('/transactions')} />
          <ListRow icon="wallet-outline" title="Income & allowance" subtitle={`${w('baon')} and pay days`} onPress={() => router.push('/income')} last />
        </Section>
      </Appear>
      <Appear index={1}>
        <Section title="Living" icon="home-outline">
          <ListRow icon="cart-outline" title="Grocery list" subtitle="Remembers last prices" onPress={() => router.push('/grocery')} />
          <ListRow icon="basket-outline" title="Essentials" subtitle="Know before it runs out" onPress={() => router.push('/essentials')} />
          <ListRow icon="swap-horizontal-outline" title={w('utang')} subtitle="Who owes who" onPress={() => router.push('/utang')} last={!barkada} />
          {barkada ? (
            <ListRow icon="people-outline" title={`${w('barkada')} & ${w('ambagan', true)}`} subtitle={`Group ${w('gala', true)} and splits`} onPress={() => router.push('/barkada')} last />
          ) : null}
        </Section>
      </Appear>
      <Appear index={2}>
        <Section>
          <ListRow icon="settings-outline" title="Settings" subtitle="Profile, schedule, look" onPress={() => router.push('/settings')} last />
        </Section>
      </Appear>
      <Appear index={3}>
        <Section title="Your data" icon="server-outline">
          <BackupRow />
          <RestoreRow />
          <ExportRows />
        </Section>
      </Appear>
      <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl }}>
        <Logo size={32} />
        <AppText variant="caption" tone="muted">
          OJT Budget {Constants.expoConfig?.version ?? ''}
        </AppText>
        <AppText variant="caption" tone="muted">
          Works offline
        </AppText>
      </View>
    </Screen>
  );
}
