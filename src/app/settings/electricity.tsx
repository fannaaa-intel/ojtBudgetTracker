import { router } from 'expo-router';
import { useState } from 'react';
import { AppText, Button, Screen, TextField } from '@/components';
import { ELECTRICITY_RATE_SOURCE } from '@/db/seed/settings';
import { useProfile } from '@/features/profile/queries';
import { deleteSetting, getElectricityRate, setSetting } from '@/features/settings/appSettings';
import { parseRate } from '@/lib/bills';
import { amountToInput } from '@/lib/transactions';
import { showSnack } from '@/store/snackbar';

/** Electricity rate (₱ per kWh) used by the bill estimator. */
export default function ElectricityRate() {
  const profile = useProfile();
  const [initial] = useState(() => (profile ? getElectricityRate(profile.user.region) : { rate: null, isDefault: true }));
  const [text, setText] = useState(initial.rate != null ? amountToInput(initial.rate) : '');
  const [error, setError] = useState<string | null>(null);
  if (!profile) return null;

  function save() {
    const rate = parseRate(text);
    if (rate == null) return setError('Enter the rate per kWh, e.g. 15.06');
    setSetting('electricity_rate', String(rate));
    router.back();
    showSnack('Electricity rate saved');
  }

  return (
    <Screen insetTop={false} title="Electricity rate" subtitle={ELECTRICITY_RATE_SOURCE[profile.user.region]} footer={<Button label="Save rate" onPress={save} />}>
      <TextField label="Rate per kWh (₱)" value={text} onChangeText={(t) => (setText(t), setError(null))} keyboardType="decimal-pad" placeholder="e.g. 15.06" error={error} />
      <AppText variant="caption" tone="muted">Used only to estimate an electricity bill from kWh. Bills you already paid never change.</AppText>
      {!initial.isDefault ? (
        <Button
          label="Use the default"
          variant="ghost"
          onPress={() => {
            deleteSetting('electricity_rate');
            router.back();
            showSnack('Electricity rate reset');
          }}
        />
      ) : null}
    </Screen>
  );
}
