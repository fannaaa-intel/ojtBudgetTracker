import { useState, type ReactNode } from 'react';
import { Button, DateField, Screen, TextField } from '@/components';
import { useTheme } from '@/theme';
import { IncomeSourcePicker } from '../../income/components/IncomeSourcePicker';
import { todayManila } from '@/lib/dates';
import { amountToInput, validateTxDraft, type TxErrors, type TxKind } from '@/lib/transactions';
import { useWallets } from '../hooks';
import type { TxInput } from '../queries';
import { CategoryPicker } from './CategoryPicker';
import { TagPicker } from './TagPicker';
import { WalletPicker } from './WalletPicker';

type Props = {
  title: string;
  kind: TxKind;
  initial?: TxInput;
  submitLabel: string;
  onSubmit: (input: TxInput) => void;
  /** Edit mode only. */
  onDelete?: () => void;
  /** Extra fields rendered after the amount (e.g. income source picker). */
  extra?: ReactNode;
};

/** Expense / income form. Amount is typed in pesos and saved as integer centavos. */
export function TransactionForm({ title, kind, initial, submitLabel, onSubmit, onDelete, extra }: Props) {
  const { typography } = useTheme();
  const wallets = useWallets();
  const [amountText, setAmountText] = useState(initial ? amountToInput(initial.amount) : '');
  const [date, setDate] = useState(initial?.date ?? todayManila());
  const [categoryId, setCategoryId] = useState<number | null>(initial?.categoryId ?? null);
  const [walletId, setWalletId] = useState<number | null>(initial?.walletId ?? wallets[0]?.id ?? null);
  const [incomeSourceId, setIncomeSourceId] = useState<number | null>(initial?.incomeSourceId ?? null);
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [note, setNote] = useState(initial?.note ?? '');
  const [errors, setErrors] = useState<TxErrors>({});

  function submit() {
    const r = validateTxDraft({ kind, amountText, date, categoryId, walletId });
    if (!r.ok) {
      setErrors(r.errors);
      return;
    }
    onSubmit({
      kind,
      amount: r.amount,
      date,
      categoryId: kind === 'income' ? null : categoryId,
      walletId,
      routeId: initial?.routeId ?? null,
      incomeSourceId: kind === 'income' ? incomeSourceId : null,
      tags,
      note: note.trim() || null,
    });
  }

  return (
    <Screen insetTop={false} title={title} footer={<Button label={submitLabel} onPress={submit} />}>
      <TextField
        label="Amount (₱)"
        value={amountText}
        onChangeText={(t) => {
          setAmountText(t);
          if (errors.amount) setErrors({ ...errors, amount: undefined });
        }}
        keyboardType="decimal-pad"
        placeholder="0.00"
        autoFocus={!initial}
        error={errors.amount}
        style={[typography.amountLarge, { minHeight: 64 }]}
      />
      {extra}
      {kind === 'income' ? (
        <IncomeSourcePicker
          value={incomeSourceId}
          onChange={(s) => {
            setIncomeSourceId(s?.id ?? null);
            if (s && amountText.trim() === '') setAmountText(amountToInput(s.amount));
          }}
        />
      ) : null}
      <DateField label="Date" value={date} onChange={setDate} />
      {kind === 'expense' ? <CategoryPicker value={categoryId} onChange={(id) => { setCategoryId(id); setErrors({ ...errors, category: undefined }); }} error={errors.category} /> : null}
      <WalletPicker value={walletId} onChange={setWalletId} error={errors.wallet} />
      {kind === 'expense' ? <TagPicker value={tags} onChange={setTags} /> : null}
      <TextField label="Note (optional)" value={note} onChangeText={setNote} placeholder={kind === 'income' ? 'e.g. Baon from Mama' : 'e.g. Jollibee with team'} />
      {onDelete ? <Button label="Delete" variant="secondary" onPress={onDelete} /> : null}
    </Screen>
  );
}
