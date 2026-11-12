import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { AppText, Button, DateField, Screen, TextField, ToggleRow } from '@/components';
import { requireUserId } from '@/features/profile/queries';
import { deleteGoal, getGoal, needsLastMonth, saveGoal } from '@/features/savings/queries';
import { addDays, todayManila } from '@/lib/dates';
import { formatPeso } from '@/lib/money';
import { validateGoal, type GoalErrors } from '@/lib/savings';
import { amountToInput } from '@/lib/transactions';
import { showSnack } from '@/store/snackbar';

/** /savings/new (?emergency=1) or /savings/<id> */
export default function GoalForm() {
  const { id: idParam, emergency } = useLocalSearchParams<{ id: string; emergency?: string }>();
  const editingId = idParam === 'new' ? undefined : Number(idParam);
  const [initial] = useState(() => (editingId != null ? getGoal(editingId) : undefined));
  const isEmergency = initial?.isEmergencyFund ?? emergency === '1';
  const [suggested] = useState(() => (isEmergency ? needsLastMonth().suggested : 0));

  const [name, setName] = useState(initial?.name ?? (isEmergency ? 'Emergency fund' : ''));
  const [targetText, setTargetText] = useState(initial ? amountToInput(initial.target) : suggested > 0 ? amountToInput(suggested) : '');
  const [openingText, setOpeningText] = useState(initial && initial.saved > 0 ? amountToInput(initial.saved) : '');
  const [hasDeadline, setHasDeadline] = useState(initial?.deadline != null);
  const [deadline, setDeadline] = useState(initial?.deadline ?? addDays(todayManila(), 60));
  const [errors, setErrors] = useState<GoalErrors>({});

  if (editingId != null && !initial) {
    return (
      <Screen insetTop={false} title="Not found">
        <AppText tone="secondary">This goal was deleted.</AppText>
      </Screen>
    );
  }

  function save() {
    const r = validateGoal({ name, targetText, openingText, deadline: hasDeadline ? deadline : null });
    if (!r.ok) return setErrors(r.errors);
    saveGoal(requireUserId(), editingId, { name, target: r.target, opening: r.opening, deadline: hasDeadline ? deadline : null, isEmergencyFund: isEmergency });
    router.back();
    showSnack(editingId ? 'Goal updated' : 'Goal added');
  }

  return (
    <Screen insetTop={false} title={editingId ? 'Edit goal' : isEmergency ? 'Emergency fund' : 'New goal'} footer={<Button label="Save goal" onPress={save} />}>
      <TextField label="Name" value={name} onChangeText={setName} placeholder="e.g. Laptop, trip home" error={errors.name} />
      <TextField label="Target (₱)" value={targetText} onChangeText={setTargetText} keyboardType="decimal-pad" placeholder="0.00" error={errors.target} />
      {isEmergency ? (
        <AppText variant="caption" tone="muted">
          {suggested > 0 ? `Suggested: ${formatPeso(suggested)} — about one month of your necessities (food, fare, bills, essentials).` : 'Aim for one month of necessities: food, fare, bills and essentials.'}
        </AppText>
      ) : null}
      <TextField label="Already saved (₱, optional)" value={openingText} onChangeText={setOpeningText} keyboardType="decimal-pad" placeholder="0.00" error={errors.opening} hint="Money you had saved before using the app." />
      <ToggleRow label="Target date" value={hasDeadline} onChange={setHasDeadline} />
      {hasDeadline ? <DateField label="Reach it by" value={deadline} onChange={setDeadline} /> : null}
      {errors.deadline ? <AppText variant="caption">{errors.deadline}</AppText> : null}
      {editingId ? (
        <Button
          label="Delete goal"
          variant="ghost"
          onPress={() =>
            Alert.alert('Delete this goal?', 'Money you added stays in your history as transfers.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => (deleteGoal(editingId), router.back(), showSnack('Goal deleted')) },
            ])
          }
        />
      ) : null}
    </Screen>
  );
}
