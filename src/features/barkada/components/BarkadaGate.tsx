import type { ReactNode } from 'react';
import { AppText, Screen } from '@/components';
import { useProfile } from '../../profile/queries';
import { featuresFor } from '@/lib/region';

/** Barkada, ambagan and group gala exist only for Metro Manila interns (CLAUDE.md rule 7). */
export function BarkadaGate({ children }: { children: ReactNode }) {
  const profile = useProfile();
  if (!profile) return null;
  if (!featuresFor(profile.user.region).barkada) {
    return (
      <Screen insetTop={false} title="Not available">
        <AppText tone="secondary">Barkada, ambagan and group gala are for Metro Manila interns. Utang still works for you in More → Utang.</AppText>
      </Screen>
    );
  }
  return <>{children}</>;
}
