import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { AppText, Button, OptionRow, Screen, TextField } from '@/components';
import { requireUserId } from '@/features/profile/queries';
import { deleteDebt, getDebt, saveDebt, setSettled } from '@/features/utang/queries';
import { validateDebt } from '@/lib/barkada';
import { amountToInput } from '@/lib/transactions';
import { showSnack } from '@/store/snackbar';
import { useTheme } from '@/theme';

/** /utang/new or /utang/<id> */
export default function DebtForm() {
  const { spacing } = useTheme();
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const editingId = idParam === 'new' ? undefined : Number(idParam);
  const [initial] = useState(() => (editingId != null ? getDebt(editingId) : undefined));
  const [person, setPerson] = useState(initial?.person ?? '');
  const [amountText, setAmountText] = useState(initial ? amountToInput(initial.amount) : '');
  const [direction, setDirection] = useState<'owed_to_me' | 'i_owe'>(initial?.direction ?? 'owed_to_me');
  const [note, setNote] = useState(initial?.note ?? '');
  const [errors, setErrors] = useState<Partial<Record<'person' | 'amount', string>>>({});

  if (editingId != null && !initial) {
    return (
      <Screen insetTop={false} title="Not found">
        <AppText tone="secondary">This utang was deleted.</AppText>
      </Screen>
    );
  }

  function save() {
    const r = validateDebt({ person, amountText });
    if (!r.ok) return setErrors(r.errors);
    saveDebt(requireUserId(), editingId, { person, amount: r.amount, direction, note });
    router.back();
    showSnack(editingId ? 'Utang updated' : 'Utang added');
  }

  return (
    <Screen insetTop={false} title={editingId ? 'Edit utang' : 'New utang'} footer={<Button label="Save" onPress={save} />}>
      <View style={{ gap: spacing.sm }}>
        <OptionRow title="They owe me" subtitle="You lent money or paid for them" selected={direction === 'owed_to_me'} onPress={() => setDirection('owed_to_me')} />
        <OptionRow title="I owe them" subtitle="They lent you money or paid for you" selected={direction === 'i_owe'} onPress={() => setDirection('i_owe')} />
      </View>
      <TextField label="Person" value={person} onChangeText={setPerson} placeholder="Name" autoCapitalize="words" error={errors.person} />
      <TextField label="Amount (₱)" value={amountText} onChangeText={setAmountText} keyboardType="decimal-pad" placeholder="0.00" error={errors.amount} />
      <TextField label="Note (optional)" value={note} onChangeText={setNote} placeholder="e.g. Lunch at Jollibee" />
      {initial ? (
        <Button
          label={initial.settledAt ? 'Mark as not settled' : 'Mark as settled'}
          variant="secondary"
          onPress={() => {
            setSettled(initial.id, !initial.settledAt);
            router.back();
            showSnack(initial.settledAt ? 'Marked open' : `Settled with ${initial.person}`, { label: 'Undo', onPress: () => setSettled(initial.id, !!initial.settledAt) });
          }}
        />
      ) : null}
      {initial ? (
        <Button
          label="Delete"
          variant="ghost"
          onPress={() =>
            Alert.alert('Delete this utang?', undefined, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => (deleteDebt(initial.id), router.back()) },
            ])
          }
        />
      ) : null}
    </Screen>
  );
}
