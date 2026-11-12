import { View } from 'react-native';
import { AppText, Chip, ChipRow } from '@/components';
import { formatPeso } from '@/lib/money';
import { useTheme } from '@/theme';
import { useIncomeSources, type IncomeSource } from '../queries';

type Props = { value: number | null; onChange: (source: IncomeSource | null) => void };

/** Which allowance this income is. Tap the selected one again to clear it. Hidden when there are no sources. */
export function IncomeSourcePicker({ value, onChange }: Props) {
  const { spacing } = useTheme();
  const sources = useIncomeSources();
  if (sources.length === 0) return null;
  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="label" tone="secondary">
        Source (optional)
      </AppText>
      <ChipRow>
        {sources.map((s) => (
          <Chip key={s.id} label={s.name} detail={formatPeso(s.amount, { hideZeroCents: true })} selected={value === s.id} onPress={() => onChange(value === s.id ? null : s)} />
        ))}
      </ChipRow>
    </View>
  );
}
