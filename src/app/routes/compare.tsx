import { router } from 'expo-router';
import { AppText, Chip, EmptyState, ListRow, Screen, Section } from '@/components';
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
    <Screen insetTop={false} title="Compare routes" subtitle="Round-trip cost and time.">
      {rows.length < 2 ? <EmptyState icon="git-compare-outline" message="Save at least two routes to compare them." /> : null}
      {rows.length > 0 ? (
        <Section>
          {rows.map((r, i) => {
            const route = routes.find((x) => x.id === r.id)!;
            const time = r.minutes == null ? 'Time not set' : r.fastest ? `${r.minutes} min` : `${r.minutes} min (+${r.extraMinutes})`;
            return (
              <ListRow
                key={r.id}
                icon={r.cheapest ? 'trophy-outline' : 'git-commit-outline'}
                title={r.name}
                subtitle={routeSummary(route)}
                right={
                  <>
                    {r.cheapest ? <Chip label="Cheapest" status="inverse" /> : <Chip label={`+${formatPeso(r.extraCost)}`} status="plain" />}
                    {r.fastest ? <Chip label="Fastest" status="outline" /> : null}
                    <Chip label={time} status="plain" />
                  </>
                }
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
