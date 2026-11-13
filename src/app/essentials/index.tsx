import { router } from 'expo-router';
import { useState } from 'react';
import { AmountPrompt, Appear, AppText, Button, Chip, EmptyState, ListRow, Screen, Section, type IconName } from '@/components';
import { markBought, useEssentials, type Essential } from '@/features/essentials/queries';
import { requireUserId } from '@/features/profile/queries';
import { todayManila } from '@/lib/dates';
import { ESSENTIAL_KINDS, essentialStatusLabel, type EssentialKind, type EssentialStatus } from '@/lib/essentials';

const KIND_ICON: Record<EssentialKind, IconName> = {
  restock: 'water-outline',
  laundry: 'shirt-outline',
  load: 'phone-portrait-outline',
  health: 'medkit-outline',
  grooming: 'cut-outline',
};
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
      subtitle="Tap “Bought” to restart the countdown."
      footer={<Button label="Add an item" onPress={() => router.push({ pathname: '/essentials/[id]', params: { id: 'new' } })} />}
    >
      {items.length === 0 ? (
        <EmptyState icon="basket-outline" message="Shampoo, laundry, data promo, vitamins, a haircut." />
      ) : (
        <Section>
          {items.map(({ item, due, status }, i) => {
            const label = essentialStatusLabel(today, due, item.kind);
            const kind = ESSENTIAL_KINDS.find((k) => k.kind === item.kind)?.label;
            const quiet = status === 'ok' || status === 'never';
            return (
              <Appear key={item.id} index={i} rise={6}>
                <ListRow
                  icon={KIND_ICON[item.kind] ?? 'ellipse-outline'}
                  title={item.name}
                  subtitle={quiet ? label : kind}
                  value={item.typicalPrice ? formatPeso(item.typicalPrice) : undefined}
                  right={
                    <>
                      <StatusChip status={status} label={label} />
                      <Button label="Bought" variant="secondary" onPress={() => setBuying(item)} style={{ minHeight: 48 }} />
                    </>
                  }
                  status={quiet ? undefined : label}
                  actions={[{ label: 'Bought', onPress: () => setBuying(item) }]}
                  onPress={() => router.push({ pathname: '/essentials/[id]', params: { id: String(item.id) } })}
                  last={i === items.length - 1}
                />
              </Appear>
            );
          })}
        </Section>
      )}
      <AppText variant="caption" tone="muted">
        One-time OJT requirements (medical, NBI, uniform) go in Add expense.
      </AppText>
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
