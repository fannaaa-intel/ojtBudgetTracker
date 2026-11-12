import { router } from 'expo-router';
import { ListRow } from '@/components';
import { formatPeso } from '@/lib/money';
import { parseTags } from '@/lib/tags';
import type { TxListItem } from '../queries';
import { tagLabel } from './TagPicker';

export function txTitle(t: TxListItem): string {
  if (t.kind === 'income') return t.sourceName ? `Income · ${t.sourceName}` : 'Income';
  if (t.parentName && t.categoryName) return `${t.parentName} · ${t.categoryName}`;
  return t.categoryName ?? 'Uncategorised';
}

/** One transaction in a list. Income shows "+", expenses show the plain amount. Tap to edit. */
export function TransactionRow({ t, last }: { t: TxListItem; last?: boolean }) {
  const meta = [...parseTags(t.tags).map(tagLabel), t.note].filter(Boolean).join(' · ');
  return (
    <ListRow
      title={txTitle(t)}
      subtitle={meta || undefined}
      value={`${t.kind === 'income' ? '+' : ''}${formatPeso(t.amount)}`}
      onPress={() => router.push({ pathname: '/transactions/[id]', params: { id: String(t.id) } })}
      last={last}
    />
  );
}
