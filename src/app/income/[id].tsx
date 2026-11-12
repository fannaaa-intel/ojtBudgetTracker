import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { AppText, Button, DateField, OptionRow, Screen, TextField } from '@/components';
import { deleteIncomeSource, getIncomeSource, saveIncomeSource } from '@/features/income/queries';
import { requireUserId } from '@/features/profile/queries';
import { todayManila } from '@/lib/dates';
import { PAY_FREQUENCY_LABEL, validateIncomeSource, type IncomeSourceErrors, type PayFrequency } from '@/lib/paySchedule';
import { amountToInput } from '@/lib/transactions';
import { showSnack } from '@/store/snackbar';
import { useTheme } from '@/theme';

const FREQUENCIES: { value: PayFrequency; hint: string }[] = [
  { value: 'weekly', hint: 'Same weekday every week' },
  { value: 'semi_monthly', hint: 'Every 15th and 30th (last day in February)' },
  { value: 'monthly', hint: 'Same date every month' },
  { value: 'once', hint: 'A single payment' },
];

/** /income/new or /income/<id> */
export default function IncomeSourceForm() {
  const { spacing } = useTheme();
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const editingId = idParam === 'new' ? undefined : Number(idParam);
  const [initial] = useState(() => (editingId != null ? getIncomeSource(editingId) : undefined));

  const [name, setName] = useState(initial?.name ?? '');
  const [amountText, setAmountText] = useState(initial ? amountToInput(initial.amount) : '');
  const [frequency, setFrequency] = useState<PayFrequency>(initial?.frequency ?? 'weekly');
  const [anchor, setAnchor] = useState(initial?.nextDate ?? todayManila());
  const [errors, setErrors] = useState<IncomeSourceErrors>({});

  if (editingId != null && !initial) {
    return (
      <Screen insetTop={false} title="Not found">
        <AppText tone="secondary">This income source was deleted.</AppText>
      </Screen>
    );
  }

  function save() {
    const r = validateIncomeSource({ name, amountText, frequency, anchor });
    if (!r.ok) {
      setErrors(r.errors);
      return;
    }
    saveIncomeSource(requireUserId(), editingId, { name, amount: r.amount, frequency, nextDate: frequency === 'semi_monthly' ? null : anchor });
    router.back();
    showSnack(editingId ? 'Income source updated' : 'Income source added');
  }

  function confirmDelete() {
    Alert.alert('Delete this source?', 'Income you already logged stays in your history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteIncomeSource(editingId!);
          router.back();
          showSnack('Income source deleted');
        },
      },
    ]);
  }

  return (
    <Screen insetTop={false} title={editingId ? 'Edit income source' : 'New income source'} footer={<Button label="Save" onPress={save} />}>
      <TextField label="Name" value={name} onChangeText={setName} placeholder="e.g. Baon from Mama" error={errors.name} />
      <TextField label="Usual amount (₱)" value={amountText} onChangeText={setAmountText} keyboardType="decimal-pad" placeholder="0.00" error={errors.amount} />
      <View style={{ gap: spacing.sm }}>
        <AppText variant="label" tone="secondary">
          How often
        </AppText>
        {FREQUENCIES.map((f) => (
          <OptionRow key={f.value} title={PAY_FREQUENCY_LABEL[f.value]} subtitle={f.hint} selected={frequency === f.value} onPress={() => setFrequency(f.value)} />
        ))}
      </View>
      {frequency !== 'semi_monthly' ? (
        <DateField
          label={frequency === 'once' ? 'Date' : 'Next payday'}
          value={anchor}
          onChange={setAnchor}
          hint={frequency === 'weekly' ? 'Repeats every 7 days from this date.' : frequency === 'monthly' ? 'Repeats on this day each month.' : undefined}
        />
      ) : null}
      {errors.anchor ? <AppText variant="caption">{errors.anchor}</AppText> : null}
      {editingId ? <Button label="Delete source" variant="ghost" onPress={confirmDelete} /> : null}
    </Screen>
  );
}
