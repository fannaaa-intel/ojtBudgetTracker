import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { AppText, Chip, ChipRow } from '@/components';
import { useLabels } from '@/store/labels';
import { useTheme } from '@/theme';
import { useCategoryTree } from '../hooks';

type Props = { value: number | null; onChange: (id: number) => void; error?: string };

/**
 * Two steps: pick a parent (Pamasahe, Pagkain …), then optionally a child (Meals, Snacks …).
 * Choosing only the parent is allowed; tapping the selected child again goes back to the parent.
 */
export function CategoryPicker({ value, onChange, error }: Props) {
  const { spacing } = useTheme();
  const { cat } = useLabels();
  const tree = useCategoryTree();
  const owner = tree.find((p) => p.id === value || p.children.some((c) => c.id === value));
  const [openId, setOpenId] = useState<number | null>(owner?.id ?? null);
  useEffect(() => {
    if (owner) setOpenId(owner.id);
  }, [owner?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = tree.find((p) => p.id === openId);

  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="label" tone="secondary">
        Category
      </AppText>
      <ChipRow>
        {tree.map((p) => (
          <Chip
            key={p.id}
            label={cat(p.key, p.name)}
            selected={owner?.id === p.id}
            onPress={() => {
              setOpenId(p.id);
              onChange(p.id);
            }}
          />
        ))}
      </ChipRow>
      {open && open.children.length > 0 ? (
        <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
          <AppText variant="caption" tone="muted">
            {cat(open.key, open.name)} — pick one (optional)
          </AppText>
          <ChipRow>
            {open.children.map((c) => (
              <Chip key={c.id} label={cat(c.key, c.name)} selected={value === c.id} onPress={() => onChange(value === c.id ? open.id : c.id)} />
            ))}
          </ChipRow>
        </View>
      ) : null}
      {error ? <AppText variant="caption">{error}</AppText> : null}
    </View>
  );
}
