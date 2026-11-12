import { router } from 'expo-router';
import { ListRow, Screen, Section } from '@/components';
import { useProfile } from '@/features/profile/queries';
import { formatDateLabel } from '@/lib/dates';
import { REGION_LABEL } from '@/lib/region';
import { useThemePref } from '@/store/theme';

const THEME_LABEL = { system: 'Same as phone', light: 'Light', dark: 'Dark' } as const;

export default function Settings() {
  const profile = useProfile();
  const pref = useThemePref((s) => s.pref);
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
      <Section title="App">
        <ListRow title="Appearance" subtitle={THEME_LABEL[pref]} onPress={() => router.push('/settings/appearance')} last />
      </Section>
    </Screen>
  );
}
