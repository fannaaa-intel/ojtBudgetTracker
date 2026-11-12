import { useState } from 'react';
import { Alert, View } from 'react-native';
import { AppText, Button, ListRow, OptionRow, Screen, Section, TextField } from '@/components';
import { useProfile } from '@/features/profile/queries';
import { addRoommate, deleteRoommate, updateLivingSetup, useRoommates } from '@/features/roommates/queries';
import { splitAvailable } from '@/lib/split';
import { useTheme } from '@/theme';

const SETUPS = [
  { value: 'home', title: 'Living at home', subtitle: 'With family' },
  { value: 'renting', title: 'Renting', subtitle: 'Apartment, room or boarding house' },
  { value: 'dorm', title: 'Dorm', subtitle: 'Bedspace or dormitory' },
] as const;

/** Living setup + roommates (roommates are used to split bills). */
export default function Living() {
  const { spacing } = useTheme();
  const profile = useProfile();
  const list = useRoommates();
  const [name, setName] = useState('');
  if (!profile) return null;
  const setup = profile.profile.livingSetup;

  return (
    <Screen insetTop={false} title="Living setup" subtitle="Renting or dorm lets you split bills with roommates.">
      <View style={{ gap: spacing.sm }}>
        {SETUPS.map((s) => (
          <OptionRow key={s.value} title={s.title} subtitle={s.subtitle} selected={setup === s.value} onPress={() => updateLivingSetup(profile.user.id, s.value)} />
        ))}
      </View>
      {splitAvailable(setup) ? (
        <>
          <Section title="Roommates">
            {list.length === 0 ? <ListRow title="No roommates yet" subtitle="Add the people you split bills with" last /> : null}
            {list.map((r, i) => (
              <ListRow
                key={r.id}
                title={r.name}
                subtitle="Tap to remove"
                onPress={() =>
                  Alert.alert(`Remove ${r.name}?`, 'Their bill shares and paid ticks are removed. Your logged expenses stay.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Remove', style: 'destructive', onPress: () => deleteRoommate(r.id) },
                  ])
                }
                last={i === list.length - 1}
              />
            ))}
          </Section>
          <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}>
              <TextField label="Add roommate" value={name} onChangeText={setName} placeholder="Name" autoCapitalize="words" />
            </View>
            <Button
              label="Add"
              variant="secondary"
              disabled={!name.trim()}
              onPress={() => {
                addRoommate(profile.user.id, name);
                setName('');
              }}
            />
          </View>
        </>
      ) : (
        <AppText variant="caption" tone="muted">Bill splitting is hidden while you live at home.</AppText>
      )}
    </Screen>
  );
}
