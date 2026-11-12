import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { AppText, Button, DateField, Screen, TextField, ToggleRow } from '@/components';
import { deleteGroceryItem, getGroceryItem, saveGroceryItem, setOnList } from '@/features/grocery/queries';
import { requireUserId } from '@/features/profile/queries';
import { todayManila } from '@/lib/dates';
import { validateGroceryItem, type GroceryErrors } from '@/lib/grocery';
import { amountToInput } from '@/lib/transactions';
import { showSnack } from '@/store/snackbar';

/** /grocery/new or /grocery/<id> */
export default function GroceryForm() {
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const editingId = idParam === 'new' ? undefined : Number(idParam);
  const [initial] = useState(() => (editingId != null ? getGroceryItem(editingId) : undefined));
  const [name, setName] = useState(initial?.name ?? '');
  const [priceText, setPriceText] = useState(initial?.lastPrice ? amountToInput(initial.lastPrice) : '');
  const [isStaple, setIsStaple] = useState(initial?.isStaple ?? false);
  const [lastsText, setLastsText] = useState(initial?.lastsDays ? String(initial.lastsDays) : '');
  const [lastBought, setLastBought] = useState(initial?.lastBought ?? todayManila());
  const [errors, setErrors] = useState<GroceryErrors>({});

  if (editingId != null && !initial) {
    return (
      <Screen insetTop={false} title="Not found">
        <AppText tone="secondary">This item was deleted.</AppText>
      </Screen>
    );
  }

  function save() {
    const r = validateGroceryItem({ name, priceText, isStaple, lastsText });
    if (!r.ok) return setErrors(r.errors);
    saveGroceryItem(requireUserId(), editingId, { name, unit: null, lastPrice: r.price, isStaple, lastsDays: r.lastsDays, lastBought: isStaple ? lastBought : null });
    router.back();
    showSnack(editingId ? 'Item updated' : `${name.trim()} added to your list`);
  }

  return (
    <Screen insetTop={false} title={editingId ? 'Edit item' : 'New item'} footer={<Button label="Save" onPress={save} />}>
      <TextField label="Item" value={name} onChangeText={setName} placeholder="e.g. Rice 5 kg, Eggs (tray)" error={errors.name} />
      <TextField label="Last price (₱, optional)" value={priceText} onChangeText={setPriceText} keyboardType="decimal-pad" placeholder="0.00" error={errors.price} />
      <ToggleRow label="Staple" description="Rice, oil, eggs… shows when it will run out." value={isStaple} onChange={setIsStaple} />
      {isStaple ? (
        <>
          <TextField label="Usually lasts (days)" value={lastsText} onChangeText={setLastsText} keyboardType="number-pad" placeholder="e.g. 14" error={errors.lasts} />
          <DateField label="Last bought" value={lastBought} onChange={setLastBought} />
        </>
      ) : null}
      {editingId && initial?.onList ? <Button label="Remove from list" variant="secondary" onPress={() => (setOnList(editingId, false), router.back())} /> : null}
      {editingId ? (
        <Button
          label="Delete item"
          variant="ghost"
          onPress={() =>
            Alert.alert('Delete this item?', 'Its price memory is removed. Logged groceries stay in your history.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => (deleteGroceryItem(editingId), router.back()) },
            ])
          }
        />
      ) : null}
    </Screen>
  );
}
