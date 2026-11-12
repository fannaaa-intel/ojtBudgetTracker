import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { AppText, Button, Screen } from '@/components';
import { TransactionForm } from '@/features/transactions/components/TransactionForm';
import { getTransactionInput, getTransfer, restoreTransaction, softDeleteTransaction, updateTransaction } from '@/features/transactions/queries';
import { formatDateLabel } from '@/lib/dates';
import { formatPeso } from '@/lib/money';
import { showSnack } from '@/store/snackbar';

/** Edit or delete one transaction. Both can be undone from the snackbar. Transfers are view + delete only. */
export default function EditTransaction() {
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const id = Number(idParam);
  // Snapshot once: this is also what Undo restores after an edit.
  const [before] = useState(() => (Number.isFinite(id) ? getTransactionInput(id) : undefined));
  const [transfer] = useState(() => (Number.isFinite(id) && !before ? getTransfer(id) : undefined));

  if (transfer) {
    return (
      <Screen
        insetTop={false}
        title={transfer.toWalletId != null ? 'Wallet transfer' : 'Savings transfer'}
        subtitle={formatDateLabel(transfer.date)}
        footer={
          <Button
            label="Delete transfer"
            variant="secondary"
            onPress={() => {
              softDeleteTransaction(id);
              router.back();
              showSnack('Transfer deleted', { label: 'Undo', onPress: () => restoreTransaction(id) });
            }}
          />
        }
      >
        <AppText variant="amountLarge">{formatPeso(transfer.amount)}</AppText>
        <AppText tone="secondary">{transfer.note ?? 'Transfer'}. Transfers move money between your own wallets or savings and are not counted as spending.</AppText>
      </Screen>
    );
  }

  if (!before) {
    return (
      <Screen insetTop={false} title="Not found">
        <AppText tone="secondary">This entry was deleted or does not exist.</AppText>
      </Screen>
    );
  }

  return (
    <TransactionForm
      title={before.kind === 'income' ? 'Edit income' : 'Edit expense'}
      kind={before.kind}
      initial={before}
      submitLabel="Save changes"
      onSubmit={(input) => {
        updateTransaction(id, input);
        router.back();
        showSnack('Changes saved', { label: 'Undo', onPress: () => updateTransaction(id, before) });
      }}
      onDelete={() => {
        softDeleteTransaction(id);
        router.back();
        showSnack('Deleted', { label: 'Undo', onPress: () => restoreTransaction(id) });
      }}
    />
  );
}
