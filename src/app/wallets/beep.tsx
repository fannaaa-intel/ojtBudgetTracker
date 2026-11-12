import { useState } from 'react';
import { View } from 'react-native';
import { AmountPrompt, AppText, Button, Chip, ListRow, Screen, Section, TextField } from '@/components';
import { requireUserId } from '@/features/profile/queries';
import { softDeleteTransaction } from '@/features/transactions/queries';
import { createBeep, setBeepBalance, topUpBeep, useBeepHistory, useBeepState } from '@/features/wallets/queries';
import { formatDateLabel } from '@/lib/dates';
import { formatPeso, toCentavos } from '@/lib/money';
import { showSnack } from '@/store/snackbar';
import { useLabels } from '@/store/labels';
import { useTheme } from '@/theme';

/** Beep card (Metro Manila trains + EDSA Carousel). Top-ups move Cash → Beep and are not spending. */
export default function BeepCard() {
  const { colors, radius, spacing } = useTheme();
  const s = useBeepState();
  const { w } = useLabels();
  const history = useBeepHistory(s?.beep?.id);
  const [openingText, setOpeningText] = useState('');
  const [prompt, setPrompt] = useState<'topup' | 'fix' | null>(null);

  if (!s) {
    return (
      <Screen insetTop={false} title="Beep card">
        <AppText tone="secondary">Beep cards are used on Metro Manila trains and the EDSA Carousel, so this is hidden for your region.</AppText>
      </Screen>
    );
  }

  if (!s.beep) {
    const opening = toCentavos(openingText);
    return (
      <Screen
        insetTop={false}
        title="Add your Beep card"
        subtitle="Pay train and Carousel fares from the card and see when it needs a top-up."
        footer={<Button label="Add card" disabled={opening == null || opening < 0} onPress={() => createBeep(requireUserId(), opening ?? 0)} />}
      >
        <TextField label="Current balance (₱)" value={openingText} onChangeText={setOpeningText} keyboardType="decimal-pad" placeholder="0.00" hint="Check it at a station reader or ticket machine." />
      </Screen>
    );
  }

  return (
    <Screen insetTop={false} title="Beep card" footer={<Button label="Top up" onPress={() => setPrompt('topup')} />}>
      <View style={{ backgroundColor: colors.inverse, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xs }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="label" tone="inverse">
            Balance
          </AppText>
          {s.low ? <Chip label="Low" status="inverse" onInverse /> : null}
        </View>
        <AppText variant="amountLarge" tone="inverse">
          {formatPeso(s.balance)}
        </AppText>
        <AppText variant="caption" tone="inverse">
          {s.roundTrip > 0 ? `About ${Math.floor(s.balance / s.roundTrip)} round trips on your daily route (${formatPeso(s.roundTrip)} each)` : 'Your daily route has no train or Carousel rides.'}
        </AppText>
      </View>
      <Button label="Balance is different? Correct it" variant="ghost" onPress={() => setPrompt('fix')} />

      <Section title="Recent">
        {history.length === 0 ? <ListRow title="No Beep activity yet" last /> : null}
        {history.map((t, i) => (
          <ListRow
            key={t.id}
            title={t.toWalletId === s.beep!.id ? 'Top-up' : (t.note ?? 'Fare')}
            subtitle={formatDateLabel(t.date)}
            value={`${t.toWalletId === s.beep!.id ? '+' : '−'}${formatPeso(t.amount)}`}
            last={i === history.length - 1}
          />
        ))}
      </Section>
      <AppText variant="caption" tone="muted">Top-ups are not spending. Fares paid with the card count as {w('pamasahe')}.</AppText>

      <AmountPrompt
        visible={prompt != null}
        title={prompt === 'topup' ? 'Top up Beep card' : 'Actual card balance'}
        message={prompt === 'topup' ? 'Moves money from Cash to the card.' : 'Sets the balance to what the reader shows.'}
        initial={prompt === 'fix' ? s.balance : 0}
        allowZero={prompt === 'fix'}
        confirmLabel={prompt === 'topup' ? 'Top up' : 'Save balance'}
        onCancel={() => setPrompt(null)}
        onSubmit={(amount) => {
          if (prompt === 'topup') {
            const id = topUpBeep(requireUserId(), s.beep!, amount);
            showSnack(`Beep topped up ${formatPeso(amount)}`, { label: 'Undo', onPress: () => softDeleteTransaction(id) });
          } else {
            setBeepBalance(s.beep!, amount);
            showSnack(`Beep balance set to ${formatPeso(amount)}`);
          }
          setPrompt(null);
        }}
      />
    </Screen>
  );
}
