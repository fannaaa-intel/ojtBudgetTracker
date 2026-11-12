import { router } from 'expo-router';
import { ListRow, Screen, Section } from '@/components';
import { useProfile } from '@/features/profile/queries';
import { useElectricityRate } from '@/features/settings/appSettings';
import { formatPeso } from '@/lib/money';
import { formatDateLabel } from '@/lib/dates';
import { REGION_LABEL } from '@/lib/region';
import { useThemePref } from '@/store/theme';

const THEME_LABEL = { system: 'Same as phone', light: 'Light', dark: 'Dark' } as const;

export default function Settings() {
  const profile = useProfile();
  const pref = useThemePref((s) => s.pref);
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
        <ListRow title="Reminders" subtitle="Daily log, OJT hours, bills, budgets, essentials, fares" onPress={() => router.push('/settings/reminders')} />
        <ListRow title="Appearance" subtitle={THEME_LABEL[pref]} onPress={() => router.push('/settings/appearance')} last />
      </Section>
    </Screen>
  );
}
