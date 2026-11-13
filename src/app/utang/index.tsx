import { router } from 'expo-router';
import { View } from 'react-native';
import { AnimatedAmount, Appear, AppText, Button, Chip, EmptyState, IconBadge, ListRow, Screen, Section } from '@/components';
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
  const row = (d: DebtRow, i: number, last: boolean) => (
    <Appear key={d.id} index={i} rise={6}>
      <ListRow
        icon={d.direction === 'owed_to_me' ? 'arrow-down-outline' : 'arrow-up-outline'}
        title={d.person}
        subtitle={d.settledAt ? `Settled ${formatDateLabel(d.settledAt)}` : d.note || (d.direction === 'owed_to_me' ? 'Owes me' : 'I owe')}
        right={d.settledAt ? <Chip label="Settled" status="plain" /> : undefined}
        value={formatPeso(d.amount)}
        onPress={() => router.push({ pathname: '/utang/[id]', params: { id: String(d.id) } })}
        last={last}
      />
    </Appear>
  );

  return (
    <Screen insetTop={false} title={w('utang')} subtitle="Who owes who." footer={<Button label={`Add ${w('utang', true)}`} onPress={() => router.push({ pathname: '/utang/[id]', params: { id: 'new' } })} />}>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        {[
          { label: 'Owed to me', value: totals.owedToMe + ambaganOwed, icon: 'arrow-down-outline' as const },
          { label: 'I owe', value: totals.iOwe, icon: 'arrow-up-outline' as const },
        ].map((c, i) => (
          <Appear key={c.label} index={i} grow style={{ flex: 1 }}>
            <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm }}>
              <IconBadge name={c.icon} size={36} />
              <AppText variant="label" tone="muted">
                {c.label}
              </AppText>
              <AnimatedAmount value={c.value} />
            </View>
          </Appear>
        ))}
      </View>

      {open.length > 0 ? <Section title="Open" icon="time-outline">{open.map((d, i) => row(d, i, i === open.length - 1))}</Section> : null}
      {fromAmbagan.length > 0 ? (
        <Section title={`From ${w('ambagan', true)} you paid`} icon="people-outline">
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
      {open.length === 0 && fromAmbagan.length === 0 ? <EmptyState icon="happy-outline" message={`No open ${w('utang', true)}. Nice.`} /> : null}
      {settled.length > 0 ? <Section title="Settled" icon="checkmark-done-outline">{settled.map((d, i) => row(d, i, i === settled.length - 1))}</Section> : null}
      <AppText variant="caption" tone="muted">
        Settling doesn't log an expense, so nothing counts twice.
      </AppText>
    </Screen>
  );
}
