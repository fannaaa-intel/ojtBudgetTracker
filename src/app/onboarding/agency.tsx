import { asc } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { AppText, Button, OptionRow, Screen, StepIndicator } from '@/components';
import { db } from '@/db/client';
import { agencies } from '@/db/schema';
import { useOnboarding } from '@/store/onboarding';

const REGION_LABEL = { NCR: 'Metro Manila', REGION_V: 'Bicol' } as const;

export default function ChooseAgency() {
  const d = useOnboarding();
  const { data } = useLiveQuery(db.select().from(agencies).orderBy(asc(agencies.id)));

  return (
    <Screen
      insetTop={false}
      title="Choose your agency"
      subtitle="Where you do your OJT. This sets your region, fares and group features."
      footer={<Button label="Continue" disabled={d.agencyId == null} onPress={() => router.push('/onboarding/home')} />}
    >
      <StepIndicator step={2} total={4} />
      {data.map((a) => (
        <OptionRow
          key={a.id}
          title={a.shortName}
          subtitle={a.address}
          meta={REGION_LABEL[a.region]}
          selected={d.agencyId === a.id}
          onPress={() => d.set({ agencyId: a.id })}
        />
      ))}
      <AppText variant="caption" tone="muted">
        Agency not listed? Ask your coordinator — custom agencies come in a later update.
      </AppText>
    </Screen>
  );
}
