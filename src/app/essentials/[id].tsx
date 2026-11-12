import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { AppText, Button, Chip, ChipRow, DateField, Screen, TextField, ToggleRow } from '@/components';
import { deleteEssential, getEssential, saveEssential } from '@/features/essentials/queries';
import { requireUserId } from '@/features/profile/queries';
import { todayManila } from '@/lib/dates';
import { ESSENTIAL_KINDS, validateEssential, type EssentialErrors, type EssentialKind } from '@/lib/essentials';
import { amountToInput } from '@/lib/transactions';
import { showSnack } from '@/store/snackbar';
import { useTheme } from '@/theme';

/** /essentials/new or /essentials/<id> */
export default function EssentialForm() {
  const { spacing } = useTheme();
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const editingId = idParam === 'new' ? undefined : Number(idParam);
  const [initial] = useState(() => (editingId != null ? getEssential(editingId) : undefined));

  const [kind, setKind] = useState<EssentialKind>(initial?.kind ?? 'restock');
  const [name, setName] = useState(initial?.name ?? '');
  const [lastsText, setLastsText] = useState(initial ? String(initial.lastsDays) : '30');
  const [priceText, setPriceText] = useState(initial?.typicalPrice ? amountToInput(initial.typicalPrice) : '');
  const [hasBought, setHasBought] = useState(initial ? initial.lastBought != null : false);
  const [lastBought, setLastBought] = useState(initial?.lastBought ?? todayManila());
  const [errors, setErrors] = useState<EssentialErrors>({});

  if (editingId != null && !initial) {
    return (
      <Screen insetTop={false} title="Not found">
        <AppText tone="secondary">This item was deleted.</AppText>
      </Screen>
    );
  }

  const meta = ESSENTIAL_KINDS.find((k) => k.kind === kind)!;

  function save() {
    const r = validateEssential({ name, lastsText, priceText });
    if (!r.ok) return setErrors(r.errors);
    saveEssential(requireUserId(), editingId, { name, kind, lastsDays: r.lastsDays, typicalPrice: r.price, lastBought: hasBought ? lastBought : null });
    router.back();
    showSnack(editingId ? 'Item updated' : 'Item added');
  }

  return (
    <Screen insetTop={false} title={editingId ? 'Edit item' : 'New item'} footer={<Button label="Save" onPress={save} />}>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="label" tone="secondary">
          Type
        </AppText>
        <ChipRow>
          {ESSENTIAL_KINDS.map((k) => (
            <Chip
              key={k.kind}
              label={k.label}
              selected={kind === k.kind}
              onPress={() => {
                setKind(k.kind);
                if (!initial) setLastsText(String(k.days));
              }}
            />
          ))}
        </ChipRow>
      </View>
      <TextField label="Name" value={name} onChangeText={setName} placeholder={meta.example} error={errors.name} />
      <TextField
        label={kind === 'load' ? 'Valid for (days)' : 'Lasts about (days)'}
        value={lastsText}
        onChangeText={setLastsText}
        keyboardType="number-pad"
        error={errors.lasts}
      />
      <TextField label="Usual price (₱, optional)" value={priceText} onChangeText={setPriceText} keyboardType="decimal-pad" placeholder="0.00" error={errors.price} />
      <ToggleRow label={kind === 'load' ? 'Already registered a promo' : 'Already bought one'} value={hasBought} onChange={setHasBought} />
      {hasBought ? <DateField label={kind === 'load' ? 'Registered on' : 'Last bought'} value={lastBought} onChange={setLastBought} /> : null}
      {editingId ? (
        <Button
          label="Delete item"
          variant="ghost"
          onPress={() =>
            Alert.alert('Delete this item?', 'Expenses you logged for it stay in your history.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => (deleteEssential(editingId), router.back(), showSnack('Item deleted')) },
            ])
          }
        />
      ) : null}
    </Screen>
  );
}
