import { View } from 'react-native';
import { AppText, Chip, ChipRow } from '@/components';
import { useTheme } from '@/theme';
import { useWallets } from '../hooks';

type Props = { value: number | null; onChange: (id: number) => void; error?: string };

export function WalletPicker({ value, onChange, error }: Props) {
  const { spacing } = useTheme();
  const wallets = useWallets();
  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="label" tone="secondary">
        Wallet
      </AppText>
      <ChipRow>
        {wallets.map((w) => (
          <Chip key={w.id} label={w.name} selected={value === w.id} onPress={() => onChange(w.id)} />
        ))}
      </ChipRow>
      {error ? <AppText variant="caption">{error}</AppText> : null}
    </View>
  );
}
