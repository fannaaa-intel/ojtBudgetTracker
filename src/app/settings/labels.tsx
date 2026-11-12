import { View } from 'react-native';
import { AppText, OptionRow, Screen, Section, ListRow } from '@/components';
import { setSetting } from '@/features/settings/appSettings';
import { WORDS, type LabelMode } from '@/lib/labels';
import { useLabelMode } from '@/store/labels';
import { useTheme } from '@/theme';

const OPTIONS: { value: LabelMode; title: string; subtitle: string }[] = [
  { value: 'taglish', title: 'Taglish', subtitle: 'Pamasahe, Pagkain, Baon, Gala, Utang, Ambagan' },
  { value: 'english', title: 'English', subtitle: 'Fare, Food, Packed lunch, Leisure, Debts, Group split' },
];

/** Settings → Labels: Taglish (default) or English words for the key money terms. */
export default function Labels() {
  const { spacing } = useTheme();
  const mode = useLabelMode((s) => s.mode);
  const setMode = useLabelMode((s) => s.setMode);
  return (
    <Screen insetTop={false} title="Labels" subtitle="How the app names your money. Your data stays the same.">
      <View style={{ gap: spacing.sm }}>
        {OPTIONS.map((o) => (
          <OptionRow
            key={o.value}
            title={o.title}
            subtitle={o.subtitle}
            selected={mode === o.value}
            onPress={() => {
              setSetting('labels', o.value);
              setMode(o.value);
            }}
          />
        ))}
      </View>
      <Section title="Preview">
        {(Object.keys(WORDS) as (keyof typeof WORDS)[]).map((k, i, all) => (
          <ListRow key={k} title={WORDS[k][mode]} subtitle={WORDS[k][mode === 'taglish' ? 'english' : 'taglish']} last={i === all.length - 1} />
        ))}
      </Section>
      <AppText variant="caption" tone="muted">Exported reports keep the category names as saved.</AppText>
    </Screen>
  );
}
