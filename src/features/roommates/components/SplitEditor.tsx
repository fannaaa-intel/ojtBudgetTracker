import { View } from 'react-native';
import { AppText, Chip, ChipRow, TextField } from '@/components';
import type { SplitMode } from '@/lib/split';
import { useTheme } from '@/theme';
import type { Roommate } from '../queries';

type Props = {
  roommates: Roommate[];
  mode: SplitMode;
  onModeChange: (m: SplitMode) => void;
  /** roommateId → custom share text (₱). Presence = included in the split. */
  shares: Record<number, string>;
  onSharesChange: (s: Record<number, string>) => void;
  error?: string | null;
};

const MODES: { value: SplitMode; label: string }[] = [
  { value: 'none', label: 'Not split' },
  { value: 'equal', label: 'Equal' },
  { value: 'custom', label: 'Custom amounts' },
];

/** Who shares this bill, and how. "Me" is always in the split. */
export function SplitEditor({ roommates, mode, onModeChange, shares, onSharesChange, error }: Props) {
  const { spacing } = useTheme();
  const toggle = (id: number) => {
    const next = { ...shares };
    if (id in next) delete next[id];
    else next[id] = '';
    onSharesChange(next);
  };

  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="label" tone="secondary">
        Split with roommates
      </AppText>
      <ChipRow>
        {MODES.map((m) => (
          <Chip key={m.value} label={m.label} selected={mode === m.value} onPress={() => onModeChange(m.value)} />
        ))}
      </ChipRow>
      {mode !== 'none' ? (
        <>
          <AppText variant="caption" tone="muted">Who shares it (you are always included)</AppText>
          <ChipRow>
            {roommates.map((r) => (
              <Chip key={r.id} label={r.name} selected={r.id in shares} onPress={() => toggle(r.id)} />
            ))}
          </ChipRow>
          {mode === 'custom'
            ? roommates
                .filter((r) => r.id in shares)
                .map((r) => (
                  <TextField
                    key={r.id}
                    label={`${r.name}’s share (₱)`}
                    value={shares[r.id]}
                    onChangeText={(t) => onSharesChange({ ...shares, [r.id]: t })}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                  />
                ))
            : null}
          {mode === 'custom' ? <AppText variant="caption" tone="muted">Your share is whatever is left of the bill.</AppText> : null}
        </>
      ) : null}
      {error ? <AppText variant="caption">{error}</AppText> : null}
    </View>
  );
}
