import { AppText, OptionRow, Screen, transitionTheme } from '@/components';
import type { ThemePref } from '@/db/schema';
import { useProfile } from '@/features/profile/queries';
import { updateThemePref } from '@/features/settings/queries';
import { useThemePref } from '@/store/theme';

const OPTIONS: { value: ThemePref; title: string; subtitle: string }[] = [
  { value: 'system', title: 'Same as phone', subtitle: 'Follows your phone’s light or dark setting' },
  { value: 'light', title: 'Light', subtitle: 'Black on white' },
  { value: 'dark', title: 'Dark', subtitle: 'White on black — easier on the eyes at night' },
];

/** System / Light / Dark. Applies immediately and is saved on this phone. */
export default function Appearance() {
  const profile = useProfile();
  const pref = useThemePref((s) => s.pref);
  if (!profile) return null;
  return (
    <Screen insetTop={false} title="Appearance">
      {OPTIONS.map((o) => (
        <OptionRow
          key={o.value}
          title={o.title}
          subtitle={o.subtitle}
          selected={pref === o.value}
          onPress={() => {
            if (o.value === pref) return;
            transitionTheme(() => updateThemePref(profile.user.id, o.value));
          }}
        />
      ))}
      <AppText variant="caption" tone="muted">The app stays black, white and grey in every mode.</AppText>
    </Screen>
  );
}
