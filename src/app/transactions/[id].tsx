import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { AppText, Screen } from '@/components';
import { TransactionForm } from '@/features/transactions/components/TransactionForm';
import { getTransactionInput, restoreTransaction, softDeleteTransaction, updateTransaction } from '@/features/transactions/queries';
import { showSnack } from '@/store/snackbar';

/** Edit or delete one transaction. Both can be undone from the snackbar. */
export default function EditTransaction() {
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const id = Number(idParam);
  // Snapshot once: this is also what Undo restores after an edit.
  const [before] = useState(() => (Number.isFinite(id) ? getTransactionInput(id) : undefined));

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
