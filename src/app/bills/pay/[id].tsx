import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { AppText, Button, Chip, ChipRow, Screen, Section, TextField, ToggleRow } from '@/components';
import { BillStatusChip } from '@/features/bills/components/BillRow';
import { getPayment, markBillPaid, remarkBillPaid, unmarkBillPaid, useBillsThisMonth } from '@/features/bills/queries';
import { useProfile } from '@/features/profile/queries';
import { setSharePaid, useBillSplit } from '@/features/roommates/queries';
import { useElectricityRate } from '@/features/settings/appSettings';
import { billStatusLabel, kwhCost, parseKwh } from '@/lib/bills';
import { formatDateLabel, todayManila } from '@/lib/dates';
import { formatPeso, toCentavos } from '@/lib/money';
import { computeSplit, splitAvailable } from '@/lib/split';
import { amountToInput } from '@/lib/transactions';
import { showSnack } from '@/store/snackbar';
import { useTheme } from '@/theme';

/**
 * Pay this month's bill: the bill total (or kWh for electricity), whether you paid the whole bill
 * or only your share, and which roommates have paid you back. Logs the amount you actually paid.
 */
export default function PayBill() {
  const { spacing } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useProfile();
  const b = useBillsThisMonth().find((x) => x.bill.id === Number(id));
  const rate = useElectricityRate(profile?.user.region);
  const split = useBillSplit(b?.bill.id, b?.period ?? '');
  const [amountText, setAmountText] = useState(b && b.bill.amount > 0 ? amountToInput(b.bill.amount) : '');
  const [kwhText, setKwhText] = useState('');
  const [paidWhat, setPaidWhat] = useState<'whole' | 'mine'>('whole');
  const [error, setError] = useState<string | null>(null);

  if (!profile) return null;
  if (!b) {
    return (
      <Screen insetTop={false} title="Bill not found">
        <AppText tone="secondary">This bill was deleted.</AppText>
      </Screen>
    );
  }

  const today = todayManila();
  const isElectricity = b.categoryKey === 'bills_electricity';
  const kwh = parseKwh(kwhText);
  const isSplit = b.bill.splitMode !== 'none' && split.shares.length > 0 && splitAvailable(profile.profile.livingSetup);
  const total = b.payment ? b.payment.amount : (toCentavos(amountText) ?? 0);
  const res = isSplit ? computeSplit(total, b.bill.splitMode, split.shares) : null;
  const parts = res?.ok ? res.split : null;
  const shareOf = (roommateId: number) => parts?.shares.find((s) => s.roommateId === roommateId)?.amount ?? 0;

  function pay() {
    const billTotal = toCentavos(amountText);
    if (billTotal == null || billTotal <= 0) return setError('Enter the bill amount');
    if (isSplit && !parts) return setError(res && !res.ok ? res.error : 'Check the split');
    const paid = isSplit && paidWhat === 'mine' && parts ? parts.mine : billTotal;
    const noteBits = [b!.bill.name, b!.period, isElectricity && kwh != null ? `${kwh} kWh` : null, isSplit ? (paidWhat === 'mine' ? 'my share' : 'whole bill') : null];
    const r = markBillPaid(profile!.user.id, b!.bill, b!.period, { billTotal, paid }, noteBits.filter(Boolean).join(' · '));
    router.back();
    showSnack(`${b!.bill.name} · you paid ${formatPeso(paid)}`, { label: 'Undo', onPress: () => unmarkBillPaid(r.paymentId) });
  }

  function undoPaid() {
    const p = getPayment(b!.bill.id, b!.period);
    if (!p) return;
    unmarkBillPaid(p.id);
    showSnack(`${b!.bill.name} marked unpaid`, { label: 'Undo', onPress: () => remarkBillPaid(p) });
  }

  return (
    <Screen
      insetTop={false}
      title={b.bill.name}
      subtitle={`${formatDateLabel(b.dueDate)} · ${billStatusLabel(b.status, today, b.dueDate)}`}
      footer={b.payment ? undefined : <Button label="Mark as paid" onPress={pay} />}
    >
      <BillStatusChip status={b.status} label={billStatusLabel(b.status, today, b.dueDate)} />
      {b.payment ? (
        <View style={{ gap: spacing.sm }}>
          <AppText variant="amountLarge">{formatPeso(b.payment.amount)}</AppText>
          <AppText tone="secondary">Paid on {formatDateLabel(b.payment.paidAt ?? b.dueDate)} — logged as an expense.</AppText>
          <Button label="Mark as unpaid" variant="secondary" onPress={undoPaid} />
        </View>
      ) : (
        <>
          {isElectricity ? (
            <View style={{ gap: spacing.sm }}>
              <TextField
                label="kWh used (optional)"
                value={kwhText}
                onChangeText={(t) => {
                  setKwhText(t);
                  const k = parseKwh(t);
                  if (k != null && rate.rate != null) setAmountText(amountToInput(kwhCost(k, rate.rate)));
                }}
                keyboardType="decimal-pad"
                placeholder="From your meter or bill"
              />
              <AppText variant="caption" tone="muted">
                {rate.rate != null
                  ? `Estimate: kWh × ${formatPeso(rate.rate)}/kWh${rate.isDefault ? ' (default)' : ''}. Use the amount on your bill if it differs.`
                  : 'Set your electric co-op’s rate to estimate from kWh.'}
              </AppText>
              <Button label={rate.rate != null ? 'Change rate' : 'Set electricity rate'} variant="ghost" onPress={() => router.push('/settings/electricity')} />
            </View>
          ) : null}
          <TextField
            label={isSplit ? 'Whole bill amount (₱)' : 'Amount paid (₱)'}
            value={amountText}
            onChangeText={(t) => (setAmountText(t), setError(null))}
            keyboardType="decimal-pad"
            placeholder="0.00"
            error={error}
          />
          {isSplit && parts ? (
            <View style={{ gap: spacing.sm }}>
              <AppText variant="label" tone="secondary">
                You paid
              </AppText>
              <ChipRow>
                <Chip label="The whole bill" detail={formatPeso(total)} selected={paidWhat === 'whole'} onPress={() => setPaidWhat('whole')} />
                <Chip label="Only my share" detail={formatPeso(parts.mine)} selected={paidWhat === 'mine'} onPress={() => setPaidWhat('mine')} />
              </ChipRow>
            </View>
          ) : null}
          <AppText variant="caption" tone="muted">Logged as an expense today for the amount you paid. Changing the bill later never changes this.</AppText>
        </>
      )}

      {isSplit ? (
        <Section title={`Split · your share ${parts ? formatPeso(parts.mine) : '—'}`}>
          {split.shares.map((s, i) => (
            <View key={s.roommateId} style={{ paddingVertical: spacing.xs, borderBottomWidth: 0 }}>
              <ToggleRow
                label={`${s.name} · ${formatPeso(shareOf(s.roommateId))}`}
                description={split.paid.has(s.roommateId) ? 'Paid their share this month' : 'Not paid yet'}
                value={split.paid.has(s.roommateId)}
                onChange={(v) => setSharePaid(b.bill.id, s.roommateId, b.period, v, today)}
              />
              {i === split.shares.length - 1 ? null : <View style={{ height: spacing.xs }} />}
            </View>
          ))}
        </Section>
      ) : null}

      <Button label="Edit bill" variant="ghost" onPress={() => router.push({ pathname: '/bills/[id]', params: { id: String(b.bill.id) } })} />
    </Screen>
  );
}
