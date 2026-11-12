import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { AppText, Button, Chip, ChipRow, DateField, ListRow, Screen, Section, TextField } from '@/components';
import { StatusChip } from '@/features/budgets/components/BudgetEnvelope';
import { FarePicker } from '@/features/gala/components/FarePicker';
import { logGala, useGalaAllowance } from '@/features/gala/queries';
import { useMealPresets } from '@/features/meals/queries';
import { useProfile } from '@/features/profile/queries';
import { softDeleteTransaction } from '@/features/transactions/queries';
import { todayManila } from '@/lib/dates';
import { checkAgainstAllowance, galaNote, galaTotal } from '@/lib/gala';
import { formatPeso, toCentavos } from '@/lib/money';
import { amountToInput } from '@/lib/transactions';
import { showSnack } from '@/store/snackbar';
import { useTheme } from '@/theme';

/** Solo gala: weekly allowance + planner (fare from your fare table + food + activity). */
export default function Gala() {
  const { spacing } = useTheme();
  const profile = useProfile();
  const allowance = useGalaAllowance();
  const presets = useMealPresets(profile?.user.region).filter((p) => p.price > 0);
  const [place, setPlace] = useState('');
  const [date, setDate] = useState(todayManila());
  const [fare, setFare] = useState(0);
  const [foodText, setFoodText] = useState('');
  const [activityText, setActivityText] = useState('');
  if (!profile) return null;

  const food = toCentavos(foodText) ?? 0;
  const activity = toCentavos(activityText) ?? 0;
  const parts = [
    { label: 'Fare', amount: fare },
    { label: 'Food', amount: food },
    { label: 'Activity', amount: activity },
  ];
  const total = galaTotal(parts);
  const check = checkAgainstAllowance(total, allowance ? { available: allowance.available, spent: allowance.spent } : null);

  function log() {
    if (total <= 0) return;
    const id = logGala(profile!.user.id, date, total, galaNote(place, parts, (c) => formatPeso(c)));
    showSnack(`Gala ${formatPeso(total)} logged`, { label: 'Undo', onPress: () => softDeleteTransaction(id) });
    router.back();
  }

  return (
    <Screen
      insetTop={false}
      title="Gala"
      subtitle="Plan an outing and see if it fits this week’s allowance."
      footer={
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm }}>
            <AppText variant="amount">Total {formatPeso(total)}</AppText>
            {check ? <StatusChip status={check.status} /> : null}
          </View>
          {check ? (
            <AppText variant="caption" tone="secondary">
              {check.leftAfter >= 0 ? `${formatPeso(check.leftAfter)} left this week after this` : `${formatPeso(-check.leftAfter)} over this week’s allowance`}
            </AppText>
          ) : null}
          <Button label="Log this gala" disabled={total <= 0} onPress={log} />
        </View>
      }
    >
      <Section title="This week’s allowance">
        {allowance ? (
          <ListRow
            title={`${formatPeso(allowance.left >= 0 ? allowance.left : 0)} left`}
            subtitle={`${formatPeso(allowance.spent)} spent of ${formatPeso(allowance.available)}`}
            right={<StatusChip status={allowance.status} />}
            onPress={() => router.push({ pathname: '/budgets/[id]', params: { id: String(allowance.budget.id) } })}
            last
          />
        ) : (
          <ListRow
            title="Set a weekly gala allowance"
            subtitle="A weekly Gala budget — the planner checks against it"
            onPress={() => router.push({ pathname: '/budgets/[id]', params: { id: 'new', category: 'gala', period: 'weekly' } })}
            last
          />
        )}
      </Section>

      <TextField label="Where (optional)" value={place} onChangeText={setPlace} placeholder="e.g. SM North, Intramuros" />
      <DateField label="When" value={date} onChange={setDate} />
      <FarePicker region={profile.user.region} isStudent={profile.user.isStudent} onChange={setFare} />

      <View style={{ gap: spacing.sm }}>
        <TextField label="Food (₱)" value={foodText} onChangeText={setFoodText} keyboardType="decimal-pad" placeholder="0.00" />
        {presets.length > 0 ? (
          <ChipRow>
            {presets.map((p) => (
              <Chip key={p.id} label={p.label} detail={formatPeso(p.price, { hideZeroCents: true })} onPress={() => setFoodText(amountToInput(food + p.price))} />
            ))}
          </ChipRow>
        ) : null}
      </View>
      <TextField label="Activity (₱)" value={activityText} onChangeText={setActivityText} keyboardType="decimal-pad" placeholder="Movie, entrance, games…" />
      <AppText variant="caption" tone="muted">Logged as one Gala → Outings expense with the breakdown in the note.</AppText>
    </Screen>
  );
}
