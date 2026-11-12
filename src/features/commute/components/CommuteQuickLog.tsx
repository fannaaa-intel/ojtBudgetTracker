import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { AppText, Button, Chip, ChipRow } from '@/components';
import { useDbQuery } from '@/db/useDbQuery';
import { formatPeso } from '@/lib/money';
import { showSnack } from '@/store/snackbar';
import { useTheme } from '@/theme';
import { useProfile } from '../../profile/queries';
import { softDeleteTransaction } from '../../transactions/queries';
import { COMMUTE_TABLES, getDefaultRoute, logCommute, timesLoggedToday, totalsFor } from '../queries';

/** "Log today's commute": one tap logs the daily route (round trip by default) as Pamasahe. */
export function CommuteQuickLog() {
  const { spacing } = useTheme();
  const profile = useProfile();
  const [trip, setTrip] = useState<'round' | 'one_way'>('round');
  const state = useDbQuery(
    () => {
      const route = profile ? getDefaultRoute(profile.user.region) : undefined;
      return { route, logged: route ? timesLoggedToday(route.id) : 0 };
    },
    [...COMMUTE_TABLES, 'transactions'],
    [profile?.user.region],
  );
  const { route, logged } = state;

  if (!profile || !route) {
    return (
      <View style={{ gap: spacing.md }}>
        <AppText tone="secondary">Set up your daily route once on the Commute tab, then log the round trip here in one tap.</AppText>
        <Button label="Set up my route" onPress={() => router.push({ pathname: '/routes/[id]', params: { id: 'new' } })} />
      </View>
    );
  }

  if (route.needsUpdate) {
    return (
      <View style={{ gap: spacing.md }}>
        <AppText tone="secondary">“{route.name}” uses fares from your old region. Update its rides first.</AppText>
        <Button label="Fix route" onPress={() => router.push({ pathname: '/routes/[id]', params: { id: String(route.id) } })} />
      </View>
    );
  }

  const totals = totalsFor(route, profile.user.isStudent);
  const amount = trip === 'round' ? totals.roundTrip : totals.oneWay;

  function doLog() {
    const r = logCommute(route!.id, trip);
    showSnack(`Pamasahe ${formatPeso(r.amount)} logged`, { label: 'Undo', onPress: () => softDeleteTransaction(r.id) });
  }

  function onPress() {
    if (logged > 0) {
      Alert.alert('Log again?', `You already logged “${route!.name}” ${logged === 1 ? 'once' : `${logged} times`} today.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log again', onPress: doLog },
      ]);
    } else doLog();
  }

  return (
    <View style={{ gap: spacing.md }}>
      <AppText variant="heading">{route.name}</AppText>
      <ChipRow>
        <Chip label="Round trip" detail={formatPeso(totals.roundTrip)} selected={trip === 'round'} onPress={() => setTrip('round')} />
        <Chip label="One way" detail={formatPeso(totals.oneWay)} selected={trip === 'one_way'} onPress={() => setTrip('one_way')} />
      </ChipRow>
      {logged > 0 ? <AppText variant="caption" tone="muted">Logged {logged === 1 ? 'once' : `${logged}×`} today.</AppText> : null}
      <Button label={`Log today’s commute · ${formatPeso(amount)}`} onPress={onPress} />
    </View>
  );
}
