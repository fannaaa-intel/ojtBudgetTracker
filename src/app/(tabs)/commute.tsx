import { router } from 'expo-router';
import { Appear, AppText, Button, Chip, ListRow, Screen, Section } from '@/components';
import { FaresCheckedBanner, useFaresCheckedLabel } from '@/features/commute/components/FaresCheckedBanner';
import { RouteList } from '@/features/commute/components/RouteList';
import { useFareCheck, useRoutes } from '@/features/commute/queries';
import { useProfile } from '@/features/profile/queries';
import { useBeepState } from '@/features/wallets/queries';
import { formatPeso } from '@/lib/money';

export default function Commute() {
  const profile = useProfile();
  const routes = useRoutes(profile?.user.region);
  const checked = useFaresCheckedLabel(profile?.user.region);
  const { due } = useFareCheck(profile?.user.region);
  const beep = useBeepState();
  if (!profile) return null;

  return (
    <Screen title="Commute" subtitle={due ? undefined : checked}>
      {due ? (
        <Appear>
          <FaresCheckedBanner region={profile.user.region} />
        </Appear>
      ) : null}
      <Appear index={1}>
        <RouteList routes={routes} isStudent={profile.user.isStudent} />
      </Appear>
      <Button label="New route" onPress={() => router.push({ pathname: '/routes/[id]', params: { id: 'new' } })} />
      <AppText variant="caption" tone="muted">
        Fares for each route’s usual trip{profile.user.isStudent ? ', student discount included' : ''}.
      </AppText>
      <Appear index={2}>
        <Section title="Fares and cards" icon="card-outline">
          {beep ? (
            <ListRow
              icon="card-outline"
              title="Beep card"
              subtitle={beep.beep ? 'Balance on the card' : 'For trains and the Carousel'}
              value={beep.beep ? formatPeso(beep.balance) : undefined}
              right={beep.low ? <Chip label="Low" status="inverse" /> : undefined}
              status={beep.low ? 'Low balance' : undefined}
              onPress={() => router.push('/wallets/beep')}
            />
          ) : null}
          {routes.length >= 2 ? <ListRow icon="git-compare-outline" title="Compare routes" subtitle="Cheapest vs fastest" onPress={() => router.push('/routes/compare')} /> : null}
          <ListRow icon="pricetags-outline" title="Fare table" subtitle="See and edit fares" onPress={() => router.push('/fares')} />
          <ListRow icon="trending-up-outline" title="Update fares" subtitle="After a fare hike" onPress={() => router.push('/fares/update')} last />
        </Section>
      </Appear>
    </Screen>
  );
}
