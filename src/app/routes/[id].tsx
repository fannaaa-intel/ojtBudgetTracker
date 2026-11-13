import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { AppText, Button, Chip, ChipRow, Screen, TextField, ToggleRow } from '@/components';
import { LegEditor, type LegForm } from '@/features/commute/components/LegEditor';
import { deleteRoute, getRoute, saveRoute, useFareRules, useRoutes, type LegDraft } from '@/features/commute/queries';
import { useProfile } from '@/features/profile/queries';
import { estimateRoadKm } from '@/lib/distance';
import { formatPeso } from '@/lib/money';
import { parseLegText, routeTotals, TRIP_LABEL, tripFare, type TripType } from '@/lib/route';
import { amountToInput } from '@/lib/transactions';
import { showSnack } from '@/store/snackbar';
import { useTheme } from '@/theme';

let keySeq = 0;
const newLeg = (): LegForm => ({ key: `leg${keySeq++}`, fareRuleId: null, fromLabel: '', toLabel: '', kmEstText: '', kmActText: '', fareText: '', discountApplies: true });

/** /routes/new or /routes/<id>: ordered legs, live one-way and round-trip total. */
export default function RouteEditor() {
  const { spacing } = useTheme();
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const profile = useProfile();
  const region = profile?.user.region;
  const rules = useFareRules(region);
  const allRoutes = useRoutes(region);
  const editingId = idParam === 'new' ? undefined : Number(idParam);

  const [initial] = useState(() => (editingId != null && region ? getRoute(editingId, region) : undefined));
  const [name, setName] = useState(initial?.name ?? (profile ? `Home → ${profile.agency.shortName}` : ''));
  const [minutes, setMinutes] = useState(initial?.minutes != null ? String(initial.minutes) : '');
  const [makeDefault, setMakeDefault] = useState(initial?.isDefault ?? allRoutes.length === 0);
  const [trip, setTrip] = useState<TripType>(initial?.trip ?? 'round');
  const [legs, setLegs] = useState<LegForm[]>(() =>
    initial
      ? initial.legs.map((l) => ({
          key: `leg${keySeq++}`,
          // A rule from another region is dropped so the user re-picks it.
          fareRuleId: l.rule.region === region ? l.fareRuleId : null,
          fromLabel: l.fromLabel ?? '',
          toLabel: l.toLabel ?? '',
          kmEstText: l.kmEstimated != null ? String(l.kmEstimated) : '',
          kmActText: l.kmActual != null ? String(l.kmActual) : '',
          fareText: l.fixedFare != null ? amountToInput(l.fixedFare) : '',
          discountApplies: l.discountApplies,
        }))
      : [newLeg()],
  );
  const [showErrors, setShowErrors] = useState(false);

  const parsed = useMemo(
    () =>
      legs.map((l) => {
        const rule = rules.find((r) => r.id === l.fareRuleId);
        return { rule, result: rule ? parseLegText(rule, l) : null };
      }),
    [legs, rules],
  );
  const priced = parsed.flatMap((p) => (p.rule && p.result?.ok ? [{ rule: p.rule, leg: p.result.values }] : []));
  const totals = routeTotals(priced, profile?.user.isStudent ?? false);
  const allValid = legs.length > 0 && priced.length === legs.length;

  const estimate =
    profile?.profile.homeLat != null && profile.profile.homeLng != null && profile.agency.lat != null && profile.agency.lng != null
      ? estimateRoadKm({ lat: profile.profile.homeLat, lng: profile.profile.homeLng }, { lat: profile.agency.lat, lng: profile.agency.lng })
      : null;

  if (!profile) return null;
  if (editingId != null && !initial) {
    return (
      <Screen insetTop={false} title="Route not found">
        <AppText tone="secondary">This route was deleted.</AppText>
      </Screen>
    );
  }

  const patchLeg = (i: number, patch: Partial<LegForm>) => setLegs((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const moveLeg = (i: number, dir: -1 | 1) =>
    setLegs((ls) => {
      const next = [...ls];
      const [item] = next.splice(i, 1);
      next.splice(i + dir, 0, item);
      return next;
    });

  function save() {
    const mins = minutes.trim() === '' ? null : Number(minutes);
    if (!name.trim() || !allValid || (mins != null && (!Number.isInteger(mins) || mins <= 0))) {
      setShowErrors(true);
      return;
    }
    const draftLegs: LegDraft[] = parsed.map((p, i) => {
      if (!p.rule || !p.result?.ok) throw new Error('unreachable');
      return { ...p.result.values, fareRuleId: p.rule.id, fromLabel: legs[i].fromLabel, toLabel: legs[i].toLabel };
    });
    saveRoute(profile!.user.id, { id: editingId, name: name.trim(), minutes: mins, trip, makeDefault, legs: draftLegs });
    router.back();
    showSnack(editingId ? 'Route updated' : 'Route saved');
  }

  function confirmDelete() {
    Alert.alert('Delete this route?', 'Commutes you already logged keep their amounts.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteRoute(editingId!);
          router.back();
          showSnack('Route deleted');
        },
      },
    ]);
  }

  return (
    <Screen
      insetTop={false}
      title={editingId ? 'Edit route' : 'New route'}
      subtitle="Add each ride in order. Fares come from your fare table."
      footer={
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', columnGap: spacing.md }}>
            <AppText tone="secondary">{TRIP_LABEL[trip]}</AppText>
            <AppText variant="amount">{formatPeso(tripFare(totals, trip))}</AppText>
          </View>
          <Button label="Save route" onPress={save} />
        </View>
      }
    >
      <TextField label="Route name" value={name} onChangeText={setName} placeholder="Home → Office" error={showErrors && !name.trim() ? 'Give the route a name' : null} />
      {estimate != null ? (
        <AppText variant="caption" tone="muted">
          Home → {profile.agency.shortName} is about {estimate} km by road (estimate from your pin).
        </AppText>
      ) : null}
      {initial?.needsUpdate ? (
        <AppText variant="caption">Some rides used fares from your old region. Pick the ride type again for those legs.</AppText>
      ) : null}

      {legs.map((leg, i) => (
        <LegEditor
          key={leg.key}
          index={i}
          total={legs.length}
          leg={leg}
          rules={rules}
          isStudent={profile.user.isStudent}
          showErrors={showErrors}
          onChange={(patch) => patchLeg(i, patch)}
          onRemove={() => setLegs((ls) => ls.filter((_, j) => j !== i))}
          onMove={(dir) => moveLeg(i, dir)}
        />
      ))}
      {showErrors && legs.length === 0 ? <AppText variant="caption">Add at least one ride.</AppText> : null}
      <Button label="Add another ride" variant="secondary" onPress={() => setLegs((ls) => [...ls, newLeg()])} />

      <View style={{ gap: spacing.sm }}>
        <AppText variant="label" tone="secondary">
          Usual trip
        </AppText>
        <ChipRow>
          {(['round', 'one_way'] as const).map((t) => (
            <Chip key={t} label={TRIP_LABEL[t]} detail={formatPeso(tripFare(totals, t))} selected={trip === t} onPress={() => setTrip(t)} />
          ))}
        </ChipRow>
        <AppText variant="caption" tone="muted">
          Shown on the Commute tab and logged by default. You can still pick the other when logging.
        </AppText>
      </View>

      <TextField
        label="Travel time, one way (minutes)"
        value={minutes}
        onChangeText={setMinutes}
        keyboardType="number-pad"
        placeholder="optional"
        error={showErrors && minutes.trim() !== '' && !(Number.isInteger(Number(minutes)) && Number(minutes) > 0) ? 'Whole minutes, e.g. 45' : null}
      />
      <ToggleRow
        label="My daily route"
        description={
          initial?.isDefault
            ? 'This is your daily route. To change it, turn this on for another route.'
            : 'Used by “Log today’s commute” on the Add tab.'
        }
        value={makeDefault}
        onChange={setMakeDefault}
        disabled={initial?.isDefault}
      />
      {editingId ? <Button label="Delete route" variant="ghost" onPress={confirmDelete} /> : null}
    </Screen>
  );
}
