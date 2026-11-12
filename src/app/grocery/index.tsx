import { router } from 'expo-router';
import { useState } from 'react';
import { AmountPrompt, AppText, Button, Chip, ListRow, Screen, Section } from '@/components';
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
      subtitle="Prices are remembered so you can see when they go up."
      footer={
        cart.length > 0 ? (
          <Button
            label={`Done shopping · ${formatPeso(total)}`}
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
      <Section title={`To buy · ${list.length}`} action={cart.length ? <AppText variant="caption" tone="secondary">{cart.length} in cart</AppText> : undefined}>
        {list.length === 0 ? <ListRow title="Your list is empty" subtitle="Add items below or tap “Add an item”" last /> : null}
        {list.map(({ item }, i) => {
          const note = item.inCart ? priceNote(item.lastPrice, item.cartPrice) : item.lastPrice ? `Last time ${formatPeso(item.lastPrice)}` : 'No price yet';
          return (
            <ListRow
              key={item.id}
              title={`${item.inCart ? '✓ ' : ''}${item.name}`}
              subtitle={note ?? undefined}
              right={item.inCart && priceWentUp(item.lastPrice, item.cartPrice) ? <Chip label="Price up" status="outline" /> : undefined}
              value={item.inCart && item.cartPrice ? formatPeso(item.cartPrice) : undefined}
              onPress={() => (item.inCart ? setInCart(item.id, null) : setPricing(item))}
              last={i === list.length - 1}
            />
          );
        })}
      </Section>
      {list.length > 0 ? <AppText variant="caption" tone="muted">Tap an item to put it in the cart with its price. Tap again to take it out.</AppText> : null}

      {staples.length > 0 ? (
        <Section title="Staples">
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
        <Section title="Add back to the list">
          {others.map(({ item }, i) => (
            <ListRow
              key={item.id}
              title={item.name}
              subtitle={item.lastPrice ? `Last ${formatPeso(item.lastPrice)}${item.prevPrice ? ` · before ${formatPeso(item.prevPrice)}` : ''}` : undefined}
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
