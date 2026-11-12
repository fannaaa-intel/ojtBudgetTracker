import { router } from 'expo-router';
import { AppText, Chip, ListRow, Screen, Section } from '@/components';
import { routeSummary } from '@/features/commute/components/RouteList';
import { totalsFor, useRoutes } from '@/features/commute/queries';
import { useProfile } from '@/features/profile/queries';
import { formatPeso } from '@/lib/money';
import { compareRoutes } from '@/lib/wallet';

/** Saved routes side by side: round-trip cost vs minutes, cheapest and fastest marked. */
export default function CompareRoutes() {
  const profile = useProfile();
  const routes = useRoutes(profile?.user.region).filter((r) => !r.needsUpdate);
  if (!profile) return null;
  const rows = compareRoutes(routes.map((r) => ({ id: r.id, name: r.name, cost: totalsFor(r, profile.user.isStudent).roundTrip, minutes: r.minutes != null ? r.minutes * 2 : null })));

  return (
    <Screen insetTop={false} title="Compare routes" subtitle="Round trip cost and time. Add travel minutes to a route to compare speed.">
      {rows.length < 2 ? <AppText tone="secondary">Save at least two routes to compare them.</AppText> : null}
      {rows.length > 0 ? (
        <Section>
          {rows.map((r, i) => {
            const route = routes.find((x) => x.id === r.id)!;
            const diff = [r.cheapest ? null : `+${formatPeso(r.extraCost)}`, r.minutes == null ? 'time not set' : r.fastest ? `${r.minutes} min` : `${r.minutes} min (+${r.extraMinutes})`].filter(Boolean).join(' · ');
            return (
              <ListRow
                key={r.id}
                title={r.name}
                subtitle={`${routeSummary(route)}\n${diff}`}
                right={r.cheapest ? <Chip label="Cheapest" status="inverse" /> : r.fastest ? <Chip label="Fastest" status="outline" /> : undefined}
                value={formatPeso(r.cost)}
                onPress={() => router.push({ pathname: '/routes/[id]', params: { id: String(r.id) } })}
                last={i === rows.length - 1}
              />
            );
          })}
        </Section>
      ) : null}
      {rows.some((r) => r.cheapest && r.fastest) ? <AppText variant="caption" tone="secondary">Your cheapest route is also the fastest.</AppText> : null}
    </Screen>
  );
}
