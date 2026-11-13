import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { AnimatedAmount, AppText, Button, Chip, ChipRow, DateField, ListRow, ProgressBar, Screen, Section, TextField, ToggleRow } from '@/components';
import { BarkadaGate } from '@/features/barkada/components/BarkadaGate';
import { createAmbagan, deleteAmbagan, setSharePaid, useAmbagan, useBarkada } from '@/features/barkada/queries';
import { requireUserId } from '@/features/profile/queries';
import { AMBAGAN_KINDS, ambaganSplit, type AmbaganKind } from '@/lib/barkada';
import { formatDateLabel, todayManila } from '@/lib/dates';
import { formatPeso, toCentavos } from '@/lib/money';
import { showSnack } from '@/store/snackbar';
import { useTheme } from '@/theme';

/** /barkada/ambagan/new?barkadaId=… (form) or /barkada/ambagan/<id> (shares + paid ticks). */
export default function AmbaganScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <BarkadaGate>{id === 'new' ? <NewAmbagan /> : <AmbaganDetail id={Number(id)} />}</BarkadaGate>;
}

function NewAmbagan() {
  const { spacing } = useTheme();
  const { barkadaId } = useLocalSearchParams<{ barkadaId: string }>();
  const data = useBarkada(Number(barkadaId));
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<AmbaganKind>('gala');
  const [date, setDate] = useState(todayManila());
  const [totalText, setTotalText] = useState('');
  const [mode, setMode] = useState<'equal' | 'custom'>('equal');
  const [included, setIncluded] = useState<Record<string, string> | null>(null);
  const [paidBy, setPaidBy] = useState('me');
  const [error, setError] = useState<string | null>(null);
  if (!data) return null;

  const members = data.members;
  // Everyone is included by default; value = custom share text.
  const inc = included ?? Object.fromEntries(members.map((m) => [m.name, '']));
  const names = members.map((m) => m.name).filter((n) => n in inc);
  const total = toCentavos(totalText) ?? 0;
  const split = total > 0 ? ambaganSplit(total, mode, names.map((n) => (mode === 'custom' ? (toCentavos(inc[n]) ?? 0) : 0))) : null;

  function create() {
    if (!title.trim()) return setError('Give it a title, e.g. Gala sa Intramuros');
    if (total <= 0) return setError('Enter the total amount');
    if (names.length === 0) return setError('Include at least one member');
    if (!split || !split.ok) return setError(split && !split.ok ? split.error : 'Check the split');
    if (paidBy !== 'me' && !names.includes(paidBy)) return setError('The payer must be in the split');
    createAmbagan(requireUserId(), {
      barkadaId: data!.barkada.id,
      title,
      date,
      total,
      kind,
      splitMode: mode,
      shares: names.map((n, i) => ({ memberName: n, share: split.members[i] })),
      mine: split.mine,
      paidBy,
    });
    router.back();
    showSnack(`Ambagan saved · your share ${formatPeso(split.mine)}`);
  }

  return (
    <Screen insetTop={false} title="New ambagan" subtitle={data.barkada.name} footer={<Button label="Save ambagan" onPress={create} />}>
      <ChipRow>
        {AMBAGAN_KINDS.map((k) => (
          <Chip key={k.kind} label={k.label} selected={kind === k.kind} onPress={() => setKind(k.kind)} />
        ))}
      </ChipRow>
      <TextField label="Title" value={title} onChangeText={(t) => (setTitle(t), setError(null))} placeholder="e.g. Gala sa Intramuros" />
      <DateField label="Date" value={date} onChange={setDate} />
      <TextField label="Total (₱)" value={totalText} onChangeText={(t) => (setTotalText(t), setError(null))} keyboardType="decimal-pad" placeholder="0.00" />

      <View style={{ gap: spacing.sm }}>
        <AppText variant="label" tone="secondary">
          Split
        </AppText>
        <ChipRow>
          <Chip label="Equal" selected={mode === 'equal'} onPress={() => setMode('equal')} />
          <Chip label="Custom amounts" selected={mode === 'custom'} onPress={() => setMode('custom')} />
        </ChipRow>
        <AppText variant="caption" tone="muted">Who is in (you are always included)</AppText>
        <ChipRow>
          {members.map((m) => (
            <Chip
              key={m.id}
              label={m.name}
              selected={m.name in inc}
              onPress={() => {
                const next = { ...inc };
                if (m.name in next) delete next[m.name];
                else next[m.name] = '';
                setIncluded(next);
              }}
            />
          ))}
        </ChipRow>
        {mode === 'custom'
          ? names.map((n) => (
              <TextField key={n} label={`${n}’s share (₱)`} value={inc[n]} onChangeText={(t) => setIncluded({ ...inc, [n]: t })} keyboardType="decimal-pad" placeholder="0.00" />
            ))
          : null}
      </View>

      <View style={{ gap: spacing.sm }}>
        <AppText variant="label" tone="secondary">
          Who paid the total?
        </AppText>
        <ChipRow>
          <Chip label="Me" selected={paidBy === 'me'} onPress={() => setPaidBy('me')} />
          {names.map((n) => (
            <Chip key={n} label={n} selected={paidBy === n} onPress={() => setPaidBy(n)} />
          ))}
        </ChipRow>
      </View>

      {split?.ok ? (
        <Section title="Shares">
          <ListRow title="You" subtitle="Logged as a Gala expense" value={formatPeso(split.mine)} />
          {names.map((n, i) => (
            <ListRow key={n} title={n} value={formatPeso(split.members[i])} last={i === names.length - 1} />
          ))}
        </Section>
      ) : null}
      <AppText variant="caption" tone="muted">
        {paidBy === 'me' ? 'Members’ shares will show as owed to you in Utang until you tick them paid.' : `An utang “I owe ${paidBy}” is added for your share.`}
      </AppText>
      {error ? <AppText>{error}</AppText> : null}
    </Screen>
  );
}

function AmbaganDetail({ id }: { id: number }) {
  const { spacing } = useTheme();
  const data = useAmbagan(id);
  if (!data) {
    return (
      <Screen insetTop={false} title="Not found">
        <AppText tone="secondary">This ambagan was deleted.</AppText>
      </Screen>
    );
  }
  const { ambagan: a, shares } = data;
  const membersTotal = shares.reduce((s, x) => s + x.share, 0);
  const mine = a.total - membersTotal;
  const paidCount = shares.filter((s) => s.paidAt).length;

  return (
    <Screen insetTop={false} title={a.title} subtitle={`${data.barkada.name}, ${formatDateLabel(a.date)}`}>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="label" tone="muted">
          {AMBAGAN_KINDS.find((k) => k.kind === a.kind)?.label}
        </AppText>
        <AnimatedAmount value={a.total} variant="amountLarge" />
        <AppText tone="secondary">Paid by {a.paidBy === 'me' ? 'you' : a.paidBy}</AppText>
        <View style={{ flexDirection: 'row', gap: spacing.lg }}>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="caption" tone="secondary">
              Your share
            </AppText>
            <AppText variant="amount">{formatPeso(mine)}</AppText>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="caption" tone="secondary">
              Paid
            </AppText>
            <AppText variant="amount">
              {paidCount} of {shares.length}
            </AppText>
          </View>
        </View>
        <ProgressBar pct={shares.length ? (paidCount / shares.length) * 100 : 0} />
      </View>
      <Section title="Members" icon="people-outline">
        {shares.map((s) => (
          <View key={s.memberName} style={{ paddingVertical: spacing.xs }}>
            <ToggleRow
              label={`${s.memberName}, ${formatPeso(s.share)}`}
              description={s.memberName === a.paidBy ? 'Paid the total' : s.paidAt ? `Paid ${formatDateLabel(s.paidAt)}` : a.paidBy === 'me' ? 'Owes you' : `Owes ${a.paidBy}`}
              value={!!s.paidAt}
              disabled={s.memberName === a.paidBy}
              onChange={(v) => setSharePaid(a.id, s.memberName, v)}
            />
          </View>
        ))}
      </Section>
      <Button
        label="Delete ambagan"
        variant="ghost"
        onPress={() =>
          Alert.alert('Delete this ambagan?', 'Your share’s expense and any linked utang are removed.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => {
                deleteAmbagan(a.id);
                router.back();
                showSnack('Ambagan deleted');
              },
            },
          ])
        }
      />
    </Screen>
  );
}
