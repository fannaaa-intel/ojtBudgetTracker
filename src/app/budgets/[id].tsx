import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { AppText, Button, Chip, ChipRow, OptionRow, Screen, TextField, ToggleRow } from '@/components';
import { deleteBudget, findDuplicateBudget, getBudget, saveBudget } from '@/features/budgets/queries';
import { requireUserId, useProfile } from '@/features/profile/queries';
import { useCategoryTree } from '@/features/transactions/hooks';
import type { BudgetDays, BudgetPeriod } from '@/lib/budget';
import { formatWeekdays } from '@/lib/dates';
import { parseWorkdays } from '@/lib/ojt';
import { toCentavos } from '@/lib/money';
import { amountToInput } from '@/lib/transactions';
import { useLabels } from '@/store/labels';
import { showSnack } from '@/store/snackbar';
import { useTheme } from '@/theme';

/** /budgets/new or /budgets/<id>: one envelope per category (or all spending) and period. */
export default function BudgetForm() {
  const { spacing } = useTheme();
  // Optional presets for a new budget, e.g. /budgets/new?category=gala&period=weekly
  const { id: idParam, category: presetKey, period: presetPeriod } = useLocalSearchParams<{ id: string; category?: string; period?: string }>();
  const editingId = idParam === 'new' ? undefined : Number(idParam);
  const [initial] = useState(() => (editingId != null ? getBudget(editingId) : undefined));
  const tree = useCategoryTree();
  const { cat } = useLabels();
  const presetId = presetKey ? tree.find((c) => c.key === presetKey)?.id : undefined;

  const [categoryId, setCategoryId] = useState<number | null | undefined>(initial ? initial.categoryId : presetId);
  const [period, setPeriod] = useState<BudgetPeriod>(initial ? (initial.period === 'monthly' ? 'monthly' : 'weekly') : presetPeriod === 'monthly' ? 'monthly' : 'weekly');
  const [limitText, setLimitText] = useState(initial ? amountToInput(initial.limitAmount) : '');
  const [rollover, setRollover] = useState(initial?.rollover ?? false);
  // null = not chosen yet: duty days for a new weekly budget, every day for Gala (outings are mostly weekends).
  const [daysPick, setDays] = useState<BudgetDays | null>(initial && initial.period === 'weekly' ? initial.days : null);
  const [error, setError] = useState<string | null>(null);
  const profile = useProfile();
  const dutyLabel = formatWeekdays(parseWorkdays(profile?.profile.workdays ?? '1,2,3,4,5'));
  const chosenKey = categoryId == null ? null : tree.find((c) => c.id === categoryId)?.key;
  const days: BudgetDays = daysPick ?? (chosenKey === 'gala' ? 'all' : 'duty');

  if (editingId != null && !initial) {
    return (
      <Screen insetTop={false} title="Not found">
        <AppText tone="secondary">This budget was deleted.</AppText>
      </Screen>
    );
  }

  function save() {
    const limit = toCentavos(limitText);
    if (categoryId === undefined) return setError('Choose what this budget is for');
    if (limit == null || limit <= 0) return setError('Enter a budget amount more than ₱0');
    if (findDuplicateBudget({ categoryId, period }, editingId)) return setError(`You already have a ${period} budget for this. Edit that one instead.`);
    saveBudget(requireUserId(), editingId, { categoryId, period, limitAmount: limit, rollover, days: period === 'weekly' ? days : 'all' });
    router.back();
    showSnack(editingId ? 'Budget updated' : 'Budget added');
  }

  function confirmDelete() {
    Alert.alert('Delete this budget?', 'Your spending history is not affected.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteBudget(editingId!);
          router.back();
          showSnack('Budget deleted');
        },
      },
    ]);
  }

  return (
    <Screen insetTop={false} title={editingId ? 'Edit budget' : 'New budget'} footer={<Button label="Save budget" onPress={save} />}>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="label" tone="secondary">
          Budget for
        </AppText>
        <ChipRow>
          <Chip label="All spending" selected={categoryId === null} onPress={() => (setCategoryId(null), setError(null))} />
          {tree.map((c) => (
            <Chip key={c.id} label={cat(c.key, c.name)} selected={categoryId === c.id} onPress={() => (setCategoryId(c.id), setError(null))} />
          ))}
        </ChipRow>
        <AppText variant="caption" tone="muted">A category budget includes all its sub-categories.</AppText>
      </View>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="label" tone="secondary">
          Period
        </AppText>
        <OptionRow title="Weekly" subtitle="Resets every Monday. Used for “safe to spend today”" selected={period === 'weekly'} onPress={() => setPeriod('weekly')} />
        <OptionRow title="Monthly" subtitle="1st to the end of the month. Gives the daily limit if you have no weekly budget" selected={period === 'monthly'} onPress={() => setPeriod('monthly')} />
      </View>
      {period === 'weekly' ? (
        <View style={{ gap: spacing.sm }}>
          <AppText variant="label" tone="secondary">
            Covers
          </AppText>
          <OptionRow
            title={`Duty days only (${dutyLabel})`}
            subtitle="Weekends and holidays vary, so they are not counted"
            selected={days === 'duty'}
            onPress={() => setDays('duty')}
          />
          <OptionRow title="Every day" subtitle="Monday to Sunday" selected={days === 'all'} onPress={() => setDays('all')} />
        </View>
      ) : null}
      <TextField label={period === 'weekly' && days === 'duty' ? `Limit for ${dutyLabel} (₱)` : 'Limit (₱)'} value={limitText} onChangeText={(t) => (setLimitText(t), setError(null))} keyboardType="decimal-pad" placeholder="0.00" />
      <ToggleRow label="Roll over leftover" description="Unspent money is added to the next period. Overspending is not carried." value={rollover} onChange={setRollover} />
      {error ? <AppText>{error}</AppText> : null}
      {editingId ? <Button label="Delete budget" variant="ghost" onPress={confirmDelete} /> : null}
    </Screen>
  );
}
