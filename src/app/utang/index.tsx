import { router } from 'expo-router';
import { View } from 'react-native';
import { AppText, Button, Chip, ListRow, Screen, Section } from '@/components';
import { useOwedFromAmbagan } from '@/features/barkada/queries';
import { useDebts, type DebtRow } from '@/features/utang/queries';
import { utangTotals } from '@/lib/barkada';
import { formatDateLabel } from '@/lib/dates';
import { formatPeso } from '@/lib/money';
import { useLabels } from '@/store/labels';
import { useTheme } from '@/theme';

/** Utang: who owes me, who I owe. A tracker only — settling never logs an expense. */
export default function Utang() {
  const { colors, radius, spacing } = useTheme();
  const all = useDebts();
  const fromAmbagan = useOwedFromAmbagan();
  const { w } = useLabels();
  const totals = utangTotals(all);
  const ambaganOwed = fromAmbagan.reduce((s, x) => s + x.amount, 0);
  const open = all.filter((d) => !d.settledAt);
  const settled = all.filter((d) => d.settledAt);
  const row = (d: DebtRow, last: boolean) => (
    <ListRow
      key={d.id}
      title={d.person}
      subtitle={[d.direction === 'owed_to_me' ? 'Owes me' : 'I owe', d.note, d.settledAt ? `settled ${formatDateLabel(d.settledAt)}` : null].filter(Boolean).join(' · ')}
      right={d.settledAt ? <Chip label="Settled" status="plain" /> : undefined}
      value={formatPeso(d.amount)}
      onPress={() => router.push({ pathname: '/utang/[id]', params: { id: String(d.id) } })}
      last={last}
    />
  );

  return (
    <Screen insetTop={false} title={w('utang')} subtitle="Keep track of who owes whom." footer={<Button label={`Add ${w('utang', true)}`} onPress={() => router.push({ pathname: '/utang/[id]', params: { id: 'new' } })} />}>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        {[
          { label: 'Owed to me', value: totals.owedToMe + ambaganOwed },
          { label: 'I owe', value: totals.iOwe },
        ].map((c) => (
          <View key={c.label} style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xs }}>
            <AppText variant="label" tone="muted">
              {c.label}
            </AppText>
            <AppText variant="amount">{formatPeso(c.value)}</AppText>
          </View>
        ))}
      </View>

      {open.length > 0 ? <Section title="Open">{open.map((d, i) => row(d, i === open.length - 1))}</Section> : null}
      {fromAmbagan.length > 0 ? (
        <Section title={`From ${w('ambagan', true)} you paid`}>
          {fromAmbagan.map((x, i) => (
            <ListRow
              key={`${x.ambaganId}:${x.memberName}`}
              title={x.memberName}
              subtitle={x.title}
              value={formatPeso(x.amount)}
              onPress={() => router.push({ pathname: '/barkada/ambagan/[id]', params: { id: String(x.ambaganId) } })}
              last={i === fromAmbagan.length - 1}
            />
          ))}
        </Section>
      ) : null}
      {open.length === 0 && fromAmbagan.length === 0 ? <AppText tone="secondary">No open utang. Nice.</AppText> : null}
      {settled.length > 0 ? <Section title="Settled">{settled.map((d, i) => row(d, i === settled.length - 1))}</Section> : null}
      <AppText variant="caption" tone="muted">Settling an utang does not log an expense, so nothing is counted twice.</AppText>
    </Screen>
  );
}
