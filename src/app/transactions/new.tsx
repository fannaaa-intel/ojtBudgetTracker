import { router, useLocalSearchParams } from 'expo-router';
import { requireUserId } from '@/features/profile/queries';
import { TransactionForm } from '@/features/transactions/components/TransactionForm';
import { addTransaction, softDeleteTransaction } from '@/features/transactions/queries';
import { formatPeso } from '@/lib/money';
import { showSnack } from '@/store/snackbar';

/** /transactions/new?kind=expense|income */
export default function NewTransaction() {
  const { kind: kindParam } = useLocalSearchParams<{ kind?: string }>();
  const kind = kindParam === 'income' ? 'income' : 'expense';

  return (
    <TransactionForm
      title={kind === 'income' ? 'New income' : 'New expense'}
      kind={kind}
      submitLabel="Save"
      onSubmit={(input) => {
        const id = addTransaction(requireUserId(), input);
        router.back();
        showSnack(`${kind === 'income' ? 'Income' : 'Expense'} ${formatPeso(input.amount)} saved`, {
          label: 'Undo',
          onPress: () => softDeleteTransaction(id),
        });
      }}
    />
  );
}
