import { eq } from 'drizzle-orm';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';
import { AppText, Button, OptionRow, Screen, StepIndicator, TextField } from '@/components';
import { db } from '@/db/client';
import { agencies } from '@/db/schema';
import { estimateRoadKm, parseLocation, REGION_REFERENCE } from '@/lib/distance';
import { useOnboarding } from '@/store/onboarding';
import { useTheme } from '@/theme';

export default function HomeLocation() {
  const { spacing } = useTheme();
  const d = useOnboarding();
  const agency = d.agencyId != null ? db.select().from(agencies).where(eq(agencies.id, d.agencyId)).get() : undefined;
  const reference = REGION_REFERENCE[agency?.region ?? 'NCR'];

  const home = useMemo(() => (d.homeLocationInput ? parseLocation(d.homeLocationInput, reference) : null), [d.homeLocationInput, reference]);
  const estimate =
    home && agency?.lat != null && agency?.lng != null ? estimateRoadKm(home, { lat: agency.lat, lng: agency.lng }) : null;

  let hint = 'Optional. Paste a Google Maps pin, "14.68, 121.05", or a Plus Code.';
  if (d.homeLocationInput && !home) hint = 'Could not read that location. Try "lat, lng" or a Plus Code.';
  if (home) hint = `Read as ${home.lat.toFixed(4)}, ${home.lng.toFixed(4)}`;

  return (
    <Screen
      insetTop={false}
      title="Where do you live?"
      subtitle="To estimate your commute. Exact km can come later."
      footer={<Button label="Continue" disabled={d.homeAddress.trim().length < 3} onPress={() => router.push('/onboarding/schedule')} />}
    >
      <StepIndicator step={3} total={4} />
      <TextField label="Home address" value={d.homeAddress} onChangeText={(homeAddress) => d.set({ homeAddress })} placeholder="Street, barangay, city" multiline />
      <TextField label="Map pin (optional)" value={d.homeLocationInput} onChangeText={(homeLocationInput) => d.set({ homeLocationInput })} placeholder="14.68, 121.05" autoCapitalize="characters" hint={hint} />
      {estimate != null ? (
        <View style={{ gap: spacing.xs }}>
          <AppText variant="label" tone="muted">Estimated distance to {agency?.shortName}</AppText>
          <AppText variant="amount">≈ {estimate} km (estimate)</AppText>
        </View>
      ) : null}
      <View style={{ gap: spacing.sm }}>
        <AppText variant="label" tone="secondary">Living setup</AppText>
        <OptionRow title="Living at home" subtitle="No rent; optional ambag sa bahay" selected={d.livingSetup === 'home'} onPress={() => d.set({ livingSetup: 'home' })} />
        <OptionRow title="Renting (apartment / room)" subtitle="Tracks rent, electricity, water, Wi-Fi" selected={d.livingSetup === 'renting'} onPress={() => d.set({ livingSetup: 'renting' })} />
        <OptionRow title="Dorm / bedspace" subtitle="Tracks dorm fee and shared bills" selected={d.livingSetup === 'dorm'} onPress={() => d.set({ livingSetup: 'dorm' })} />
      </View>
    </Screen>
  );
}
