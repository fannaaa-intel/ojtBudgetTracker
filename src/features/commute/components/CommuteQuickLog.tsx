import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { AppText, Button, Chip, ChipRow } from '@/components';
import { useDbQuery } from '@/db/useDbQuery';
import { formatPeso } from '@/lib/money';
import { TRIP_LABEL, tripFare, tripTimes, type TripType } from '@/lib/route';
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
  // null = use the route's usual trip; a tap on a chip overrides it for this log only.
  const [tripPick, setTrip] = useState<TripType | null>(null);
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

  const trip: TripType = tripPick ?? route.trip;
  const totals = totalsFor(route, profile.user.isStudent);
  const amount = tripFare(totals, trip);
  const canBeep = !!beep?.beep && beep.oneWay > 0;
  const beepPart = (beep?.oneWay ?? 0) * tripTimes(trip);

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
        {(['round', 'one_way'] as const).map((t) => (
          <Chip key={t} label={TRIP_LABEL[t]} detail={formatPeso(tripFare(totals, t))} selected={trip === t} onPress={() => setTrip(t)} />
        ))}
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
