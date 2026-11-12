import { router } from 'expo-router';
import { ListRow, Screen, Section } from '@/components';
import { EraseRow } from '@/features/backup/EraseRow';
import { useProfile } from '@/features/profile/queries';
import { useElectricityRate } from '@/features/settings/appSettings';
import { formatPeso } from '@/lib/money';
import { formatDateLabel } from '@/lib/dates';
import { REGION_LABEL } from '@/lib/region';
import { useLabelMode } from '@/store/labels';
import { useThemePref } from '@/store/theme';

const THEME_LABEL = { system: 'Same as phone', light: 'Light', dark: 'Dark' } as const;

export default function Settings() {
  const profile = useProfile();
  const pref = useThemePref((s) => s.pref);
  const labelMode = useLabelMode((s) => s.mode);
  const elec = useElectricityRate(profile?.user.region);
  if (!profile) return null;
  const { user, profile: ojt, agency } = profile;

  return (
    <Screen insetTop={false} title="Settings">
      <Section title="You">
        <ListRow
          title="Profile"
          subtitle={`${user.name}${user.school ? ` · ${user.school}` : ''} · ${user.isStudent ? 'Student discount on' : 'No student discount'}`}
          onPress={() => router.push('/settings/profile')}
        />
        <ListRow title="Agency" subtitle={`${agency.shortName} · ${REGION_LABEL[user.region]}`} onPress={() => router.push('/settings/agency')} />
        <ListRow
          title="OJT schedule"
          subtitle={`Starts ${formatDateLabel(ojt.startDate)} · ${ojt.hoursPerDay} h/day · ${ojt.requiredHours ? `${ojt.requiredHours} h required` : 'required hours not set'}`}
          onPress={() => router.push('/settings/schedule')}
          last
        />
      </Section>
      <Section title="Living costs">
        <ListRow
          title="Living setup & roommates"
          subtitle={{ home: 'Living at home', renting: 'Renting', dorm: 'Dorm' }[ojt.livingSetup]}
          onPress={() => router.push('/settings/living')}
        />
        <ListRow
          title="Electricity rate"
          subtitle={elec.rate != null ? `${formatPeso(elec.rate)}/kWh${elec.isDefault ? ' (default)' : ''}` : 'Not set — enter your co-op’s rate'}
          onPress={() => router.push('/settings/electricity')}
          last
        />
      </Section>
      <Section title="App">
        <ListRow title="App lock" subtitle={profile.user.pinHash ? 'PIN on' : 'Off — set a PIN or use fingerprint'} onPress={() => router.push('/settings/security')} />
        <ListRow title="Reminders" subtitle="Daily log, OJT hours, bills, budgets, essentials, fares" onPress={() => router.push('/settings/reminders')} />
        <ListRow title="Appearance" subtitle={THEME_LABEL[pref]} onPress={() => router.push('/settings/appearance')} />
        <ListRow title="Labels" subtitle={labelMode === 'taglish' ? 'Taglish — Pamasahe, Pagkain, Gala' : 'English — Fare, Food, Leisure'} onPress={() => router.push('/settings/labels')} last />
      </Section>
      <Section title="Danger zone">
        <EraseRow />
      </Section>
    </Screen>
  );
}
