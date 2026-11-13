import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { AppText, Button, Chip, ChipRow } from '@/components';
import { useDbQuery } from '@/db/useDbQuery';
import { formatPeso } from '@/lib/money';
import { labelNow } from '@/store/labels';
import { showSnack } from '@/store/snackbar';
import { useTheme } from '@/theme';
import { useProfile } from '../../profile/queries';
import { softDeleteTransaction } from '../../transactions/queries';
import { useBeepState } from '../../wallets/queries';
import { COMMUTE_TABLES, getDefaultRoute, logCommute, timesLoggedToday, totalsFor } from '../queries';

/** "Log today's commute": one tap logs the daily route (round trip by default) as Pamasahe. */
export function CommuteQuickLog() {
  const { spacing } = useTheme();
  const profile = useProfile();
  const [trip, setTrip] = useState<'round' | 'one_way'>('round');
  const [payBeep, setPayBeep] = useState(true);
  const beep = useBeepState();
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
        <AppText tone="secondary">Save your daily route once, then log it here in one tap.</AppText>
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
  const canBeep = !!beep?.beep && beep.roundTrip > 0;
  const beepPart = trip === 'round' ? beep?.roundTrip ?? 0 : (beep?.roundTrip ?? 0) / 2;

  function doLog() {
    const r = logCommute(route!.id, trip, canBeep && payBeep ? beep!.beep!.id : null);
    showSnack(`${labelNow('pamasahe')} ${formatPeso(r.amount)} logged`, { label: 'Undo', onPress: () => r.ids.forEach(softDeleteTransaction) });
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
      {canBeep ? (
        <ChipRow>
          <Chip label="Trains on Beep" detail={`${formatPeso(beepPart)} from card`} selected={payBeep} onPress={() => setPayBeep(true)} />
          <Chip label="All cash" selected={!payBeep} onPress={() => setPayBeep(false)} />
        </ChipRow>
      ) : null}
      {canBeep && payBeep && beep!.low ? <AppText variant="caption">Beep card is low: {formatPeso(beep!.balance)} left.</AppText> : null}
      {logged > 0 ? <AppText variant="caption" tone="muted">Logged {logged === 1 ? 'once' : `${logged}×`} today.</AppText> : null}
      <Button label={`Log commute, ${formatPeso(amount)}`} accessibilityLabel={`Log today's commute, ${formatPeso(amount)}`} onPress={onPress} />
    </View>
  );
}
