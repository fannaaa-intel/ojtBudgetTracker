import { router } from 'expo-router';
import { Appear, ListRow, Screen, Section } from '@/components';
import { EraseRow } from '@/features/backup/EraseRow';
import { useProfile } from '@/features/profile/queries';
import { useElectricityRate } from '@/features/settings/appSettings';
import { formatDateLabel } from '@/lib/dates';
import { formatPeso } from '@/lib/money';
import { REGION_LABEL } from '@/lib/region';
import { useLabelMode } from '@/store/labels';
import { useThemePref } from '@/store/theme';

const THEME_LABEL = { system: 'Same as phone', light: 'Light', dark: 'Dark' } as const;

/** Settings: one short line per row; the details live on each screen. */
export default function Settings() {
  const profile = useProfile();
  const pref = useThemePref((s) => s.pref);
  const labelMode = useLabelMode((s) => s.mode);
  const elec = useElectricityRate(profile?.user.region);
  if (!profile) return null;
  const { user, profile: ojt, agency } = profile;

  return (
    <Screen insetTop={false} title="Settings">
      <Appear>
        <Section title="You" icon="person-outline">
          <ListRow icon="person-circle-outline" title="Profile" subtitle={user.isStudent ? `${user.name}, student` : user.name} onPress={() => router.push('/settings/profile')} />
          <ListRow icon="business-outline" title="Agency" subtitle={`${agency.shortName}, ${REGION_LABEL[user.region]}`} onPress={() => router.push('/settings/agency')} />
          <ListRow
            icon="calendar-outline"
            title="OJT schedule"
            subtitle={ojt.requiredHours ? `${ojt.hoursPerDay} h a day, ${ojt.requiredHours} h total` : `Since ${formatDateLabel(ojt.startDate)}, ${ojt.hoursPerDay} h a day`}
            onPress={() => router.push('/settings/schedule')}
            last
          />
        </Section>
      </Appear>
      <Appear index={1}>
        <Section title="Living costs" icon="home-outline">
          <ListRow
            icon="bed-outline"
            title="Living setup & roommates"
            subtitle={{ home: 'Living at home', renting: 'Renting', dorm: 'Dorm' }[ojt.livingSetup]}
            onPress={() => router.push('/settings/living')}
          />
          <ListRow
            icon="flash-outline"
            title="Electricity rate"
            subtitle={elec.rate != null ? `${formatPeso(elec.rate)} per kWh${elec.isDefault ? ', default' : ''}` : 'Enter your co-op’s rate'}
            onPress={() => router.push('/settings/electricity')}
            last
          />
        </Section>
      </Appear>
      <Appear index={2}>
        <Section title="App" icon="phone-portrait-outline">
          <ListRow icon="lock-closed-outline" title="App lock" subtitle={profile.user.pinHash ? 'PIN on' : 'Off'} onPress={() => router.push('/settings/security')} />
          <ListRow icon="notifications-outline" title="Reminders" subtitle="Logs, hours, bills and more" onPress={() => router.push('/settings/reminders')} />
          <ListRow icon="contrast-outline" title="Appearance" subtitle={THEME_LABEL[pref]} onPress={() => router.push('/settings/appearance')} />
          <ListRow icon="language-outline" title="Labels" subtitle={labelMode === 'taglish' ? 'Taglish' : 'English'} onPress={() => router.push('/settings/labels')} last />
        </Section>
      </Appear>
      <Appear index={3}>
        <Section title="Danger zone" icon="warning-outline">
          <EraseRow />
        </Section>
      </Appear>
    </Screen>
  );
}
