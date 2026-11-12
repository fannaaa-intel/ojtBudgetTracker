import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { AppText, Button, Chip, ListRow, Screen, Section, TextField } from '@/components';
import { BarkadaGate } from '@/features/barkada/components/BarkadaGate';
import { addMember, deleteBarkada, removeMember, useBarkada } from '@/features/barkada/queries';
import { AMBAGAN_KINDS } from '@/lib/barkada';
import { formatDateLabel } from '@/lib/dates';
import { formatPeso } from '@/lib/money';
import { useTheme } from '@/theme';

/** One barkada: members and its ambagan. */
export default function BarkadaDetail() {
  return (
    <BarkadaGate>
      <Inner />
    </BarkadaGate>
  );
}

function Inner() {
  const { spacing } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const data = useBarkada(Number(id));
  const [name, setName] = useState('');

  if (!data) {
    return (
      <Screen insetTop={false} title="Not found">
        <AppText tone="secondary">This barkada was deleted.</AppText>
      </Screen>
    );
  }
  const { barkada, members, ambagan } = data;

  return (
    <Screen
      insetTop={false}
      title={barkada.name}
      subtitle={`${members.length} ${members.length === 1 ? 'member' : 'members'} + you`}
      footer={
        <Button
          label="New ambagan"
          disabled={members.length === 0}
          onPress={() => router.push({ pathname: '/barkada/ambagan/[id]', params: { id: 'new', barkadaId: String(barkada.id) } })}
        />
      }
    >
      <Section title="Ambagan">
        {ambagan.length === 0 ? <ListRow title="No ambagan yet" subtitle={members.length ? 'Tap “New ambagan” below' : 'Add members first'} last /> : null}
        {ambagan.map((a, i) => (
          <ListRow
            key={a.id}
            title={a.title}
            subtitle={`${AMBAGAN_KINDS.find((k) => k.kind === a.kind)?.label ?? ''} · ${formatDateLabel(a.date)} · paid by ${a.paidBy === 'me' ? 'you' : a.paidBy}`}
            value={formatPeso(a.total)}
            onPress={() => router.push({ pathname: '/barkada/ambagan/[id]', params: { id: String(a.id) } })}
            last={i === ambagan.length - 1}
          />
        ))}
      </Section>

      <Section title="Members">
        {members.map((m, i) => (
          <ListRow
            key={m.id}
            title={m.name}
            right={<Chip label="Remove" status="plain" />}
            onPress={() =>
              Alert.alert(`Remove ${m.name}?`, 'Past ambagan keep their shares.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => removeMember(m.id) },
              ])
            }
            last={i === members.length - 1}
          />
        ))}
        {members.length === 0 ? <ListRow title="No members yet" last /> : null}
      </Section>
      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' }}>
        <View style={{ flex: 1 }}>
          <TextField label="Add member" value={name} onChangeText={setName} placeholder="Name" autoCapitalize="words" />
        </View>
        <Button
          label="Add"
          variant="secondary"
          disabled={!name.trim() || members.some((m) => m.name.toLowerCase() === name.trim().toLowerCase())}
          onPress={() => {
            addMember(barkada.id, name);
            setName('');
          }}
        />
      </View>
      <Button
        label="Delete barkada"
        variant="ghost"
        onPress={() =>
          Alert.alert(`Delete ${barkada.name}?`, 'Its ambagan are removed. Your logged expenses stay in history.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => (deleteBarkada(barkada.id), router.back()) },
          ])
        }
      />
    </Screen>
  );
}
