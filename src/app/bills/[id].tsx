import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { AppText, Button, Chip, ChipRow, Screen, TextField, ToggleRow } from '@/components';
import { deleteBill, getBill, saveBill } from '@/features/bills/queries';
import { requireUserId, useProfile } from '@/features/profile/queries';
import { SplitEditor } from '@/features/roommates/components/SplitEditor';
import { getBillShares, setBillSplit, useRoommates } from '@/features/roommates/queries';
import { useCategoryTree } from '@/features/transactions/hooks';
import { validateBill, type BillErrors } from '@/lib/bills';
import { toCentavos } from '@/lib/money';
import { computeSplit, splitAvailable, type SplitMode } from '@/lib/split';
import { amountToInput } from '@/lib/transactions';
import { showSnack } from '@/store/snackbar';
import { useTheme } from '@/theme';

/** Bills whose amount changes every month by default. */
const VARIABLE_KEYS = ['bills_electricity', 'bills_water'];

/** /bills/new or /bills/<id>: name, type, usual amount, due day, varies-monthly. */
export default function BillForm() {
  const { spacing } = useTheme();
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const editingId = idParam === 'new' ? undefined : Number(idParam);
  const [initial] = useState(() => (editingId != null ? getBill(editingId) : undefined));
  const billTypes = useCategoryTree().find((c) => c.key === 'bills')?.children ?? [];

  const [name, setName] = useState(initial?.name ?? '');
  const [categoryId, setCategoryId] = useState<number | null>(initial?.categoryId ?? null);
  const [amountText, setAmountText] = useState(initial && initial.amount > 0 ? amountToInput(initial.amount) : '');
  const [dueDayText, setDueDayText] = useState(initial ? String(initial.dueDay) : '');
  const [isVariable, setIsVariable] = useState(initial?.isVariable ?? false);
  const [errors, setErrors] = useState<BillErrors>({});
  const profile = useProfile();
  const roommates = useRoommates();
  const [splitMode, setSplitMode] = useState<SplitMode>(initial?.splitMode ?? 'none');
  const [shares, setShares] = useState<Record<number, string>>(() =>
    Object.fromEntries((editingId != null ? getBillShares(editingId) : []).map((s) => [s.roommateId, s.share > 0 ? amountToInput(s.share) : ''])),
  );
  const [splitError, setSplitError] = useState<string | null>(null);
  const canSplit = !!profile && splitAvailable(profile.profile.livingSetup) && roommates.length > 0;

  if (editingId != null && !initial) {
    return (
      <Screen insetTop={false} title="Not found">
        <AppText tone="secondary">This bill was deleted.</AppText>
      </Screen>
    );
  }

  function save() {
    const r = validateBill({ name, amountText, dueDayText, isVariable });
    if (!r.ok) return setErrors(r.errors);

    // Split: parse custom shares and check they fit inside a fixed bill amount.
    const mode: SplitMode = canSplit ? splitMode : 'none';
    const picked = Object.entries(shares).map(([id, text]) => ({ roommateId: Number(id), share: mode === 'custom' ? toCentavos(text) : 0 }));
    if (mode !== 'none' && picked.length === 0) return setSplitError('Pick at least one roommate, or choose “Not split”.');
    if (mode === 'custom' && picked.some((p) => p.share == null || p.share < 0)) return setSplitError('Enter each roommate’s share, e.g. 1200');
    const clean = picked.map((p) => ({ roommateId: p.roommateId, share: p.share ?? 0 }));
    if (mode === 'custom' && !isVariable) {
      const check = computeSplit(r.amount, 'custom', clean);
      if (!check.ok) return setSplitError(check.error);
    }

    const billId = saveBill(requireUserId(), editingId, { name, categoryId, amount: r.amount, dueDay: r.dueDay, isVariable });
    setBillSplit(billId, mode, mode === 'none' ? [] : clean);
    router.back();
    showSnack(editingId ? 'Bill updated' : 'Bill added');
  }

  function confirmDelete() {
    Alert.alert('Delete this bill?', 'Payments you already logged stay in your history.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => (deleteBill(editingId!), router.back(), showSnack('Bill deleted')) },
    ]);
  }

  return (
    <Screen insetTop={false} title={editingId ? 'Edit bill' : 'New bill'} footer={<Button label="Save bill" onPress={save} />}>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="label" tone="secondary">
          Type
        </AppText>
        <ChipRow>
          {billTypes.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              selected={categoryId === c.id}
              onPress={() => {
                setCategoryId(c.id);
                if (!name.trim() || billTypes.some((t) => t.name === name)) setName(c.name);
                if (!initial) setIsVariable(VARIABLE_KEYS.includes(c.key));
              }}
            />
          ))}
        </ChipRow>
      </View>
      <TextField label="Name" value={name} onChangeText={setName} placeholder="e.g. Boarding house rent" error={errors.name} />
      <TextField
        label={isVariable ? 'Usual amount (₱, optional)' : 'Monthly amount (₱)'}
        value={amountText}
        onChangeText={setAmountText}
        keyboardType="decimal-pad"
        placeholder="0.00"
        error={errors.amount}
      />
      <TextField label="Due day of the month" value={dueDayText} onChangeText={setDueDayText} keyboardType="number-pad" placeholder="e.g. 5" hint="31 becomes the last day in shorter months." error={errors.dueDay} />
      <ToggleRow label="Amount changes every month" description="For electricity or water. You enter the real amount when you pay." value={isVariable} onChange={setIsVariable} />
      {canSplit ? (
        <SplitEditor
          roommates={roommates}
          mode={splitMode}
          onModeChange={(m) => (setSplitMode(m), setSplitError(null))}
          shares={shares}
          onSharesChange={(s) => (setShares(s), setSplitError(null))}
          error={splitError}
        />
      ) : profile && splitAvailable(profile.profile.livingSetup) ? (
        <AppText variant="caption" tone="muted">Add roommates in Settings → Living setup to split this bill.</AppText>
      ) : null}
      {editingId ? <Button label="Delete bill" variant="ghost" onPress={confirmDelete} /> : null}
    </Screen>
  );
}
