import { router } from 'expo-router';
import { useState } from 'react';
import { AmountPrompt, Appear, AppText, Button, Chip, EmptyState, ListRow, Screen, Section } from '@/components';
import { finishTrip, setInCart, setOnList, useGrocery, type GroceryItem } from '@/features/grocery/queries';
import { requireUserId } from '@/features/profile/queries';
import { todayManila } from '@/lib/dates';
import { essentialStatusLabel } from '@/lib/essentials';
import { priceNote, priceWentUp, tripTotal } from '@/lib/grocery';
import { formatPeso } from '@/lib/money';
import { showSnack } from '@/store/snackbar';

/**
 * Shopping list: tap an item to put it in the cart with the store price (price-change note
 * vs last time), then "Done shopping" logs one Groceries expense. Staples show a runs-out countdown.
 */
export default function Grocery() {
  const rows = useGrocery();
  const today = todayManila();
  const [pricing, setPricing] = useState<GroceryItem | null>(null);

  const list = rows.filter((r) => r.item.onList);
  const cart = list.filter((r) => r.item.inCart);
  const staples = rows.filter((r) => r.item.isStaple);
  const others = rows.filter((r) => !r.item.onList);
  const total = tripTotal(list.map((r) => r.item));

  return (
    <Screen
      insetTop={false}
      title="Grocery list"
      subtitle="Remembers prices so you see when they go up."
      footer={
        cart.length > 0 ? (
          <Button
            label={`Done shopping, ${formatPeso(total)}`}
            onPress={() => {
              const r = finishTrip(requireUserId());
              if (r) showSnack(`Groceries ${formatPeso(r.total)} logged (${r.count} items)`, { label: 'Undo', onPress: r.undo });
            }}
          />
        ) : (
          <Button label="Add an item" onPress={() => router.push({ pathname: '/grocery/[id]', params: { id: 'new' } })} />
        )
      }
    >
      <Section title={`To buy (${list.length})`} icon="cart-outline" action={cart.length ? <Chip label={`${cart.length} in cart`} status="outline" /> : undefined}>
        {list.length === 0 ? <EmptyState icon="cart-outline" message="Your list is empty." /> : null}
        {list.map(({ item }, i) => {
          const note = item.inCart ? priceNote(item.lastPrice, item.cartPrice) : item.lastPrice ? `Last time ${formatPeso(item.lastPrice)}` : 'No price yet';
          return (
            <Appear key={item.id} index={i} rise={6}>
              <ListRow
                icon={item.inCart ? 'checkmark-circle-outline' : 'ellipse-outline'}
                title={item.name}
                subtitle={note ?? undefined}
                right={item.inCart && priceWentUp(item.lastPrice, item.cartPrice) ? <Chip label="Price up" status="outline" /> : undefined}
                status={[item.inCart ? 'In cart' : null, item.inCart && priceWentUp(item.lastPrice, item.cartPrice) ? 'Price up' : null].filter(Boolean).join(', ') || undefined}
                value={item.inCart && item.cartPrice ? formatPeso(item.cartPrice) : undefined}
                onPress={() => (item.inCart ? setInCart(item.id, null) : setPricing(item))}
                last={i === list.length - 1}
              />
            </Appear>
          );
        })}
      </Section>
      {list.length > 0 ? <AppText variant="caption" tone="muted">Tap to put it in the cart. Tap again to take it out.</AppText> : null}

      {staples.length > 0 ? (
        <Section title="Staples" icon="hourglass-outline">
          {staples.map(({ item, due, status }, i) => (
            <ListRow
              key={item.id}
              title={item.name}
              subtitle={essentialStatusLabel(today, due, 'restock')}
              right={status === 'overdue' ? <Chip label="Out" status="inverse" /> : status === 'due_soon' ? <Chip label="Soon" status="outline" /> : undefined}
              value={item.onList ? 'On list' : undefined}
              onPress={() => (item.onList ? router.push({ pathname: '/grocery/[id]', params: { id: String(item.id) } }) : setOnList(item.id, true))}
              last={i === staples.length - 1}
            />
          ))}
        </Section>
      ) : null}

      {others.length > 0 ? (
        <Section title="Add back to the list" icon="refresh-outline">
          {others.map(({ item }, i) => (
            <ListRow
              key={item.id}
              title={item.name}
              subtitle={item.lastPrice ? `Last ${formatPeso(item.lastPrice)}` : undefined}
              value="+ List"
              onPress={() => setOnList(item.id, true)}
              last={i === others.length - 1}
            />
          ))}
        </Section>
      ) : null}
      {cart.length > 0 ? <Button label="Add an item" variant="ghost" onPress={() => router.push({ pathname: '/grocery/[id]', params: { id: 'new' } })} /> : null}

      <AmountPrompt
        visible={pricing != null}
        title={`${pricing?.name ?? ''} — price`}
        message={pricing?.lastPrice ? `Last time: ${formatPeso(pricing.lastPrice)}` : 'Price at the store today.'}
        initial={pricing?.lastPrice ?? 0}
        confirmLabel="Put in cart"
        onCancel={() => setPricing(null)}
        onSubmit={(price) => {
          if (pricing) setInCart(pricing.id, price);
          setPricing(null);
        }}
      />
    </Screen>
  );
}
