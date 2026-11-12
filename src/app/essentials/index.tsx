import { router } from 'expo-router';
import { useState } from 'react';
import { AmountPrompt, AppText, Button, Chip, ListRow, Screen, Section } from '@/components';
import { markBought, useEssentials, type Essential } from '@/features/essentials/queries';
import { requireUserId } from '@/features/profile/queries';
import { todayManila } from '@/lib/dates';
import { ESSENTIAL_KINDS, essentialStatusLabel, type EssentialStatus } from '@/lib/essentials';
import { formatPeso } from '@/lib/money';
import { showSnack } from '@/store/snackbar';

function StatusChip({ status, label }: { status: EssentialStatus; label: string }) {
  if (status === 'overdue') return <Chip label={label} status="inverse" />;
  if (status === 'due_soon') return <Chip label={label} status="outline" />;
  return null;
}

/** Toiletries, laundry, load/data, health and grooming — with "runs out / expires" reminders. */
export default function Essentials() {
  const items = useEssentials();
  const today = todayManila();
  const [buying, setBuying] = useState<Essential | null>(null);

  return (
    <Screen
      insetTop={false}
      title="Essentials"
      subtitle="Things that run out or expire. Tap “Bought” to log it and restart the countdown."
      footer={<Button label="Add an item" onPress={() => router.push({ pathname: '/essentials/[id]', params: { id: 'new' } })} />}
    >
      {items.length === 0 ? (
        <AppText tone="secondary">Nothing yet. Add shampoo, laundry, your data promo, vitamins or a haircut.</AppText>
      ) : (
        <Section>
          {items.map(({ item, due, status }, i) => {
            const label = essentialStatusLabel(today, due, item.kind);
            const kind = ESSENTIAL_KINDS.find((k) => k.kind === item.kind)?.label;
            return (
              <ListRow
                key={item.id}
                title={item.name}
                subtitle={[kind, status === 'ok' || status === 'never' ? label : null, item.typicalPrice ? formatPeso(item.typicalPrice) : null].filter(Boolean).join(' · ')}
                right={
                  <>
                    <StatusChip status={status} label={label} />
                    <Button label="Bought" variant="secondary" onPress={() => setBuying(item)} />
                  </>
                }
                onPress={() => router.push({ pathname: '/essentials/[id]', params: { id: String(item.id) } })}
                last={i === items.length - 1}
              />
            );
          })}
        </Section>
      )}
      <AppText variant="caption" tone="muted">For one-time OJT requirements (medical, NBI, uniform), use Add expense and turn on “One-time OJT requirement”.</AppText>
      <AmountPrompt
        visible={buying != null}
        title={`Bought ${buying?.name ?? ''}`}
        message="Logged as an expense today. The countdown restarts from today."
        initial={buying?.typicalPrice ?? 0}
        confirmLabel="Log it"
        onCancel={() => setBuying(null)}
        onSubmit={(amount) => {
          if (!buying) return;
          const r = markBought(requireUserId(), buying, amount);
          showSnack(`${buying.name} ${formatPeso(amount)} logged`, { label: 'Undo', onPress: r.undo });
          setBuying(null);
        }}
      />
    </Screen>
  );
}
