import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { AppText, Button, Screen, TextField, ToggleRow } from '@/components';
import { getFareRule, resetFareRule, updateFareRule } from '@/features/commute/queries';
import { useProfile } from '@/features/profile/queries';
import { computeFare } from '@/lib/fare';
import { fareValuesToForm, parseFareForm, type FareFormErrors, type FareFormText } from '@/lib/fareForm';
import { formatPeso } from '@/lib/money';
import { showSnack } from '@/store/snackbar';
import { useTheme } from '@/theme';

/** Edit one fare rule: base fare, base km, per km, student %, promo %. Sets user_edited. */
export default function EditFare() {
  const { spacing } = useTheme();
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const profile = useProfile();
  const [rule] = useState(() => getFareRule(Number(idParam)));
  const [form, setForm] = useState<FareFormText | null>(() => (rule ? fareValuesToForm(rule) : null));
  const [errors, setErrors] = useState<FareFormErrors>({});

  if (!profile) return null;
  if (!rule || !form || rule.region !== profile.user.region) {
    return (
      <Screen insetTop={false} title="Fare not found">
        <AppText tone="secondary">This fare is not in your region’s table.</AppText>
      </Screen>
    );
  }

  const set = (patch: Partial<FareFormText>) => {
    setForm({ ...form, ...patch });
    setErrors({});
  };
  const parsed = parseFareForm(form);
  const sampleKm = Math.max(rule.baseKm, 1) + 3;
  const sample = parsed.ok && !rule.isFixed ? computeFare({ ...rule, ...parsed.values }, { km: sampleKm, isStudent: profile.user.isStudent, discountApplies: true }) : null;

  function save() {
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    updateFareRule(rule!.id, parsed.values);
    router.back();
    showSnack(`${rule!.label} fare saved`);
  }

  function reset() {
    if (resetFareRule(rule!.id)) {
      router.back();
      showSnack(`${rule!.label} reset to default`);
    }
  }

  return (
    <Screen
      insetTop={false}
      title={rule.label}
      subtitle={rule.source ? `Default from: ${rule.source}` : undefined}
      footer={<Button label="Save fare" onPress={save} />}
    >
      {rule.note ? <AppText variant="caption" tone="muted">{rule.note}</AppText> : null}

      {rule.isFixed ? (
        <>
          <AppText tone="secondary">
            This ride has no formula. You enter the fare you actually pay on each route leg, so discounts are already included in what you type.
          </AppText>
          {Number(form.promoPctText) > 0 || rule.mode === 'lrt2' || rule.mode === 'mrt3' ? (
            <ToggleRow
              label="50% promo for all riders"
              description="Reminder only. Turn off when the promo ends, then update the fares on your routes."
              value={Number(form.promoPctText) > 0}
              onChange={(on) => set({ promoPctText: on ? '50' : '0' })}
            />
          ) : null}
        </>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <TextField label="Base fare (₱)" value={form.baseFareText} onChangeText={(baseFareText) => set({ baseFareText })} keyboardType="decimal-pad" error={errors.baseFareText} />
            </View>
            <View style={{ flex: 1 }}>
              <TextField label="Covers first (km)" value={form.baseKmText} onChangeText={(baseKmText) => set({ baseKmText })} keyboardType="decimal-pad" error={errors.baseKmText} />
            </View>
          </View>
          <TextField label="Each succeeding km (₱)" value={form.perKmText} onChangeText={(perKmText) => set({ perKmText })} keyboardType="decimal-pad" error={errors.perKmText} />
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <TextField label="Student discount (%)" value={form.studentPctText} onChangeText={(studentPctText) => set({ studentPctText })} keyboardType="number-pad" error={errors.studentPctText} />
            </View>
            <View style={{ flex: 1 }}>
              <TextField label="Promo for all (%)" value={form.promoPctText} onChangeText={(promoPctText) => set({ promoPctText })} keyboardType="number-pad" error={errors.promoPctText} />
            </View>
          </View>
          <AppText variant="caption" tone="muted">Discounts never stack — the larger one applies. Fares round to the nearest {formatPeso(rule.roundTo)}.</AppText>
          {sample ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText tone="secondary">Example: {sampleKm} km{profile.user.isStudent ? ', with your discount' : ''}</AppText>
              <AppText variant="amount">{formatPeso(sample.payable)}</AppText>
            </View>
          ) : null}
        </>
      )}

      <AppText variant="caption" tone="muted">Saved routes use the new fare from now on. Past entries keep what you paid.</AppText>
      {rule.userEdited ? <Button label="Reset to default" variant="ghost" onPress={reset} /> : null}
    </Screen>
  );
}
