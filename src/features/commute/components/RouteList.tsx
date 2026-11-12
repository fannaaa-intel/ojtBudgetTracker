import { router } from 'expo-router';
import { AppText, Chip, ListRow, Section } from '@/components';
import { formatPeso } from '@/lib/money';
import { totalsFor, type RouteWithLegs } from '../queries';

export function routeSummary(r: RouteWithLegs): string {
  const rides = r.legs.map((l) => l.rule.label).join(' → ') || 'No rides yet';
  return r.minutes ? `${rides} · ${r.minutes} min` : rides;
}

/** Saved routes with their round-trip fare. Tap to edit. */
export function RouteList({ routes, isStudent }: { routes: RouteWithLegs[]; isStudent: boolean }) {
  if (routes.length === 0) {
    return <AppText tone="secondary">No routes yet. Add the rides you take from home to your agency.</AppText>;
  }
  return (
    <Section title="Saved routes">
      {routes.map((r, i) => (
        <ListRow
          key={r.id}
          title={r.name}
          subtitle={r.needsUpdate ? 'Needs update — uses fares from another region' : routeSummary(r)}
          right={r.isDefault ? <Chip label="Daily" status="plain" /> : undefined}
          value={r.needsUpdate ? undefined : formatPeso(totalsFor(r, isStudent).roundTrip)}
          onPress={() => router.push({ pathname: '/routes/[id]', params: { id: String(r.id) } })}
          last={i === routes.length - 1}
        />
      ))}
    </Section>
  );
}
