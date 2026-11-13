import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ListRow, type IconName } from '@/components';
import { formatPeso } from '@/lib/money';
import { parseTags } from '@/lib/tags';
import { useLabels } from '@/store/labels';
import type { TxListItem } from '../queries';
import { tagLabel } from './TagPicker';

type Cat = (key: string | null | undefined, name: string) => string;

/** Title = the most specific name (child category, income source, transfer note). */
export function txTitle(t: TxListItem, cat: Cat = (_k, n) => n): string {
  if (t.kind === 'income') return t.sourceName ?? 'Income';
  if (t.kind === 'transfer') return t.note ?? t.categoryName ?? 'Savings';
  return t.categoryName ? cat(t.categoryKey, t.categoryName) : 'Uncategorised';
}

/** The category's own icon (outlined), or a kind icon for income / transfers. */
export function txIcon(t: TxListItem): IconName {
  if (t.kind === 'income') return 'arrow-down-outline';
  if (t.kind === 'transfer') return 'swap-horizontal-outline';
  const name = `${t.categoryIcon ?? ''}-outline`;
  return name in Ionicons.glyphMap ? (name as IconName) : 'ellipse-outline';
}

/** One transaction in a list. Income shows "+", expenses show the plain amount. Tap to edit. */
export function TransactionRow({ t, last }: { t: TxListItem; last?: boolean }) {
  const { cat, w } = useLabels();
  const tags = parseTags(t.tags).map((tag) => (tag === 'baon' ? w('baon') : tagLabel(tag)));
  const context = t.kind === 'income' ? 'Income' : t.kind === 'transfer' ? 'Transfer' : t.parentName ? cat(t.parentKey, t.parentName) : null;
  // One short line: the note if there is one, else tags, else the parent category.
  const subtitle = t.note && t.kind !== 'transfer' ? t.note : tags.length ? tags.join(', ') : context;
  return (
    <ListRow
      icon={txIcon(t)}
      title={txTitle(t, cat)}
      subtitle={subtitle ?? undefined}
      value={`${t.kind === 'income' ? '+' : ''}${formatPeso(t.amount)}`}
      onPress={() => router.push({ pathname: '/transactions/[id]', params: { id: String(t.id) } })}
      last={last}
    />
  );
}
