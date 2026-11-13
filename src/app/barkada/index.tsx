import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Appear, Button, EmptyState, ListRow, Screen, Section, TextField } from '@/components';
import { BarkadaGate } from '@/features/barkada/components/BarkadaGate';
import { createBarkada, useBarkadas } from '@/features/barkada/queries';
import { requireUserId } from '@/features/profile/queries';
import { useLabels } from '@/store/labels';
import { useTheme } from '@/theme';

/** Your barkada groups (Metro Manila only). */
export default function BarkadaList() {
  return (
    <BarkadaGate>
      <Inner />
    </BarkadaGate>
  );
}

function Inner() {
  const { spacing } = useTheme();
  const list = useBarkadas();
  const { w } = useLabels();
  const [name, setName] = useState('');

  return (
    <Screen insetTop={false} title={w('barkada')} subtitle={`${w('ambagan')} for group ${w('gala', true)} and parties.`}>
      {list.length > 0 ? (
        <Section title="Your groups" icon="people-outline">
          {list.map((b, i) => (
            <Appear key={b.id} index={i} rise={6}>
              <ListRow
                icon="people-circle-outline"
                title={b.name}
                subtitle={`${b.members} ${b.members === 1 ? 'member' : 'members'} + you`}
                onPress={() => router.push({ pathname: '/barkada/[id]', params: { id: String(b.id) } })}
                last={i === list.length - 1}
              />
            </Appear>
          ))}
        </Section>
      ) : (
        <EmptyState icon="people-outline" message="Make one for your OJT batchmates." />
      )}
      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' }}>
        <View style={{ flex: 1 }}>
          <TextField label="New barkada" value={name} onChangeText={setName} placeholder="e.g. NFRDI interns" />
        </View>
        <Button
          label="Create"
          disabled={!name.trim()}
          onPress={() => {
            const id = createBarkada(requireUserId(), name);
            setName('');
            router.push({ pathname: '/barkada/[id]', params: { id: String(id) } });
          }}
        />
      </View>
    </Screen>
  );
}
