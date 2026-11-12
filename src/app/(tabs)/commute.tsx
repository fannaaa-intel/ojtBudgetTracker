import { router } from 'expo-router';
import { AppText, Button, Chip, ListRow, Screen, Section } from '@/components';
import { useBeepState } from '@/features/wallets/queries';
import { formatPeso } from '@/lib/money';
import { FaresCheckedBanner, useFaresCheckedLabel } from '@/features/commute/components/FaresCheckedBanner';
import { RouteList } from '@/features/commute/components/RouteList';
import { useFareCheck, useRoutes } from '@/features/commute/queries';
import { useProfile } from '@/features/profile/queries';

export default function Commute() {
  const profile = useProfile();
  const routes = useRoutes(profile?.user.region);
  const checked = useFaresCheckedLabel(profile?.user.region);
  const { due } = useFareCheck(profile?.user.region);
  const beep = useBeepState();
  if (!profile) return null;

  return (
    <Screen title="Commute" subtitle={due ? undefined : checked}>
      {due ? <FaresCheckedBanner region={profile.user.region} /> : null}
      <RouteList routes={routes} isStudent={profile.user.isStudent} />
      <Button label="New route" onPress={() => router.push({ pathname: '/routes/[id]', params: { id: 'new' } })} />
      <AppText variant="caption" tone="muted">
        Amounts shown are round trips{profile.user.isStudent ? ' with your student discount' : ''}.
      </AppText>
      <Section>
        {beep ? (
          <ListRow
            title="Beep card"
            subtitle={beep.beep ? `${formatPeso(beep.balance)} on the card` : 'Add your card to pay trains and the Carousel'}
            right={beep.low ? <Chip label="Low" status="inverse" /> : undefined}
            onPress={() => router.push('/wallets/beep')}
          />
        ) : null}
        {routes.length >= 2 ? <ListRow title="Compare routes" subtitle="Cost vs minutes, cheapest and fastest" onPress={() => router.push('/routes/compare')} /> : null}
        <ListRow title="Fare table" subtitle="See and edit the fares used for your routes" onPress={() => router.push('/fares')} />
        <ListRow title="Update fares" subtitle="After a fare hike — edit a whole mode at once" onPress={() => router.push('/fares/update')} last />
      </Section>
    </Screen>
  );
}
