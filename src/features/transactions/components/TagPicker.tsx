import { View } from 'react-native';
import { AppText, Chip, ChipRow } from '@/components';
import { toggleTag, TX_TAGS } from '@/lib/tags';
import { useLabels } from '@/store/labels';
import { useTheme } from '@/theme';

const TAG_LABEL: Record<string, string> = { late: 'Late', rainy: 'Rainy', baon: 'Baon' };

export function TagPicker({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const { spacing } = useTheme();
  const { w } = useLabels();
  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="label" tone="secondary">
        Tags (optional)
      </AppText>
      <ChipRow>
        {TX_TAGS.map((t) => (
          <Chip key={t} label={t === 'baon' ? w('baon') : (TAG_LABEL[t] ?? t)} selected={value.includes(t)} onPress={() => onChange(toggleTag(value, t))} />
        ))}
      </ChipRow>
    </View>
  );
}

export function tagLabel(tag: string): string {
  return TAG_LABEL[tag] ?? tag;
}
