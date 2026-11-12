import { router } from 'expo-router';
import { ListRow } from '@/components';
import { formatPeso } from '@/lib/money';
import { parseTags } from '@/lib/tags';
import { useLabels } from '@/store/labels';
import type { TxListItem } from '../queries';
import { tagLabel } from './TagPicker';

type Cat = (key: string | null | undefined, name: string) => string;

export function txTitle(t: TxListItem, cat: Cat = (_k, n) => n): string {
  if (t.kind === 'income') return t.sourceName ? `Income · ${t.sourceName}` : 'Income';
  if (t.kind === 'transfer') return `Transfer · ${t.note ?? (t.categoryName ?? 'Savings')}`;
  if (t.parentName && t.categoryName) return `${cat(t.parentKey, t.parentName)} · ${cat(t.categoryKey, t.categoryName)}`;
  return t.categoryName ? cat(t.categoryKey, t.categoryName) : 'Uncategorised';
}

/** One transaction in a list. Income shows "+", expenses show the plain amount. Tap to edit. */
export function TransactionRow({ t, last }: { t: TxListItem; last?: boolean }) {
  const { cat, w } = useLabels();
  const meta = [...parseTags(t.tags).map((tag) => (tag === 'baon' ? w('baon') : tagLabel(tag))), t.note].filter(Boolean).join(' · ');
  return (
    <ListRow
      title={txTitle(t, cat)}
      subtitle={meta || undefined}
      value={`${t.kind === 'income' ? '+' : ''}${formatPeso(t.amount)}`}
      onPress={() => router.push({ pathname: '/transactions/[id]', params: { id: String(t.id) } })}
      last={last}
    />
  );
}
