import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { AppText, Button, Chip, ChipRow, DateField, Screen, Section, TextField } from '@/components';
import { markFaresChecked, updateFaresBulk, useFareRules, type FareRule } from '@/features/commute/queries';
import { useProfile } from '@/features/profile/queries';
import { todayManila } from '@/lib/dates';
import { FARE_GROUPS } from '@/lib/fareCheck';
import { fareValuesToForm, parseFareForm, type FareFormText, type FareValues } from '@/lib/fareForm';
import { showSnack } from '@/store/snackbar';
import { useTheme } from '@/theme';

/**
 * Bulk fare update after a fare hike: edit base fare and per-km for a whole mode group at once,
 * with one effective date. Fixed-fare rides (trains matrix, tricycle, Grab) are entered per route.
 */
export default function UpdateFares() {
  const { spacing } = useTheme();
  const profile = useProfile();
  const rules = useFareRules(profile?.user.region);
  const [group, setGroup] = useState('all');
  const [effective, setEffective] = useState(todayManila());
  const [forms, setForms] = useState<Record<number, FareFormText>>({});
  const [error, setError] = useState<string | null>(null);

  const formulaRules = rules.filter((r) => !r.isFixed);
  const groups = FARE_GROUPS.filter((g) => g.key === 'all' || formulaRules.some((r) => g.match(r.mode)));
  const shown = useMemo(() => formulaRules.filter((r) => FARE_GROUPS.find((g) => g.key === group)!.match(r.mode)), [formulaRules, group]);
  if (!profile) return null;

  const formOf = (r: FareRule) => forms[r.id] ?? fareValuesToForm(r);
  const set = (r: FareRule, patch: Partial<FareFormText>) => {
    setForms({ ...forms, [r.id]: { ...formOf(r), ...patch } });
    setError(null);
  };

  function save() {
    const changed = Object.entries(forms);
    if (changed.length === 0) {
      markFaresChecked();
      router.back();
      return showSnack('No changes — marked fares as checked today');
    }
    const rows: { id: number; values: FareValues }[] = [];
    for (const [id, text] of changed) {
      const r = parseFareForm(text);
      const rule = rules.find((x) => x.id === Number(id));
      if (!r.ok) return setError(`Check ${rule?.label ?? 'a fare'}: ${Object.values(r.errors)[0]}`);
      rows.push({ id: Number(id), values: r.values });
    }
    updateFaresBulk(rows, effective);
    router.back();
    showSnack(`${rows.length} ${rows.length === 1 ? 'fare' : 'fares'} updated`);
  }

  return (
    <Screen insetTop={false} title="Update fares" subtitle="After a fare hike: edit a whole mode at once. Past entries never change." footer={<Button label="Save fares" onPress={save} />}>
      <ChipRow>
        {groups.map((g) => (
          <Chip key={g.key} label={g.label} selected={group === g.key} onPress={() => setGroup(g.key)} />
        ))}
      </ChipRow>
      <DateField label="New fares effective from" value={effective} onChange={setEffective} />
      {shown.map((r) => {
        const f = formOf(r);
        return (
          <Section key={r.id} title={r.label}>
            <View style={{ flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md }}>
              <View style={{ flex: 1 }}>
                <TextField label="Base (₱)" value={f.baseFareText} onChangeText={(baseFareText) => set(r, { baseFareText })} keyboardType="decimal-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <TextField label="First km" value={f.baseKmText} onChangeText={(baseKmText) => set(r, { baseKmText })} keyboardType="decimal-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <TextField label="Per km (₱)" value={f.perKmText} onChangeText={(perKmText) => set(r, { perKmText })} keyboardType="decimal-pad" />
              </View>
            </View>
          </Section>
        );
      })}
      {shown.length === 0 ? <AppText tone="secondary">No formula fares in this group.</AppText> : null}
      {error ? <AppText>{error}</AppText> : null}
      <AppText variant="caption" tone="muted">Student and promo discounts stay as they are; change them per fare in the fare table. Saving with no changes just marks fares as checked today.</AppText>
    </Screen>
  );
}
