import { router } from 'expo-router';
import { Appear, Chip, EmptyState, ListRow, Section } from '@/components';
import { formatPeso } from '@/lib/money';
import { TRIP_LABEL, tripFare } from '@/lib/route';
import { totalsFor, type RouteWithLegs } from '../queries';

/** "Jeep → MRT-3" — the rides only. Minutes live on the route screen and in Compare. */
export function routeSummary(r: RouteWithLegs): string {
  return r.legs.map((l) => l.rule.label).join(' → ') || 'No rides yet';
}

/** Saved routes with their round-trip fare. Tap to edit. */
export function RouteList({ routes, isStudent }: { routes: RouteWithLegs[]; isStudent: boolean }) {
  if (routes.length === 0) {
    return (
      <Section title="Saved routes" icon="navigate-outline">
        <EmptyState icon="map-outline" message="Add the rides you take from home to your agency." />
      </Section>
    );
  }
  return (
    <Section title="Saved routes" icon="navigate-outline">
      {routes.map((r, i) => (
        <Appear key={r.id} index={i} rise={6}>
          <ListRow
            icon={r.isDefault ? 'star-outline' : 'git-commit-outline'}
            title={r.name}
            subtitle={r.needsUpdate ? 'Needs update: fares from another region' : routeSummary(r)}
            right={
              <>
                {r.isDefault ? <Chip label="Daily" status="plain" /> : null}
                <Chip label={TRIP_LABEL[r.trip]} status="plain" />
              </>
            }
            status={[r.isDefault ? 'Daily route' : null, TRIP_LABEL[r.trip]].filter(Boolean).join(', ')}
            value={r.needsUpdate ? undefined : formatPeso(tripFare(totalsFor(r, isStudent), r.trip))}
            onPress={() => router.push({ pathname: '/routes/[id]', params: { id: String(r.id) } })}
            last={i === routes.length - 1}
          />
        </Appear>
      ))}
    </Section>
  );
}
