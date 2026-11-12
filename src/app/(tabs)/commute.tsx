import { router } from 'expo-router';
import { AppText, Button, ListRow, Screen, Section } from '@/components';
import { TodoList } from '@/components/TodoList';
import { useFaresCheckedLabel } from '@/features/commute/components/FaresCheckedBanner';
import { RouteList } from '@/features/commute/components/RouteList';
import { useRoutes } from '@/features/commute/queries';
import { useProfile } from '@/features/profile/queries';

export default function Commute() {
  const profile = useProfile();
  const routes = useRoutes(profile?.user.region);
  const checked = useFaresCheckedLabel(profile?.user.region);
  if (!profile) return null;

  return (
    <Screen title="Commute" subtitle={checked}>
      <RouteList routes={routes} isStudent={profile.user.isStudent} />
      <Button label="New route" onPress={() => router.push({ pathname: '/routes/[id]', params: { id: 'new' } })} />
      <AppText variant="caption" tone="muted">
        Amounts shown are round trips{profile.user.isStudent ? ' with your student discount' : ''}.
      </AppText>
      <Section>
        <ListRow title="Fare table" subtitle="See and edit the fares used for your routes" onPress={() => router.push('/fares')} last />
      </Section>
      <TodoList phase="Phase 2" items={['Fare update screen + 90-day reminder']} />
      <TodoList phase="Phase 3" items={['Beep card wallet', 'Route compare (cost vs minutes)']} />
    </Screen>
  );
}
