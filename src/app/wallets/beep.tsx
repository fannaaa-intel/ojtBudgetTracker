import { useState } from 'react';
import { View } from 'react-native';
import { AmountPrompt, AnimatedAmount, Appear, AppText, Button, Chip, EmptyState, IconBadge, ListRow, Screen, Section, TextField } from '@/components';
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
        subtitle="Pay trains and the Carousel from the card. We'll tell you when it's low."
        footer={<Button label="Add card" disabled={opening == null || opening < 0} onPress={() => createBeep(requireUserId(), opening ?? 0)} />}
      >
        <TextField label="Current balance (₱)" value={openingText} onChangeText={setOpeningText} keyboardType="decimal-pad" placeholder="0.00" hint="Check it at a station reader or ticket machine." />
      </Screen>
    );
  }

  return (
    <Screen insetTop={false} title="Beep card" footer={<Button label="Top up" onPress={() => setPrompt('topup')} />}>
      <Appear grow>
        <View style={{ backgroundColor: colors.inverse, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <AppText variant="label" tone="inverse">
              Balance
            </AppText>
            {s.low ? <Chip label="Low" status="inverse" onInverse /> : <IconBadge name="card-outline" size={36} onInverse />}
          </View>
          <AnimatedAmount value={s.balance} variant="amountLarge" tone="inverse" />
          {s.roundTrip > 0 ? (
            <>
              <AppText variant="caption" tone="inverse" style={{ opacity: 0.85 }}>
                About {Math.floor(s.balance / s.roundTrip)} round trips left
              </AppText>
              <AppText variant="caption" tone="inverse" style={{ opacity: 0.65 }}>
                {formatPeso(s.roundTrip)} each on your daily route
              </AppText>
            </>
          ) : (
            <AppText variant="caption" tone="inverse" style={{ opacity: 0.85 }}>
              Your daily route has no train or Carousel rides.
            </AppText>
          )}
        </View>
      </Appear>
      <Button label="Balance is different? Correct it" variant="ghost" onPress={() => setPrompt('fix')} />

      <Section title="Recent" icon="time-outline">
        {history.length === 0 ? <EmptyState icon="card-outline" message="No Beep activity yet." /> : null}
        {history.map((t, i) => (
          <Appear key={t.id} index={i} rise={6}>
            <ListRow
              icon={t.toWalletId === s.beep!.id ? 'add-circle-outline' : 'train-outline'}
              title={t.toWalletId === s.beep!.id ? 'Top-up' : (t.note ?? 'Fare')}
              subtitle={formatDateLabel(t.date)}
              value={`${t.toWalletId === s.beep!.id ? '+' : '−'}${formatPeso(t.amount)}`}
              last={i === history.length - 1}
            />
          </Appear>
        ))}
      </Section>
      <AppText variant="caption" tone="muted">
        Top-ups aren't spending. Card fares count as {w('pamasahe')}.
      </AppText>

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
