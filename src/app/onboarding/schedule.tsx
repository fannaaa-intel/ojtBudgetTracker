import { eq } from 'drizzle-orm';
import { router } from 'expo-router';
import { useState } from 'react';
import { AppText, Button, DateField, Screen, StepIndicator, TextField } from '@/components';
import { db } from '@/db/client';
import { agencies, ojtProfile, users, wallets } from '@/db/schema';
import { validateSchedule } from '@/lib/profile';
import { parseLocation, REGION_REFERENCE } from '@/lib/distance';
import { useOnboarding } from '@/store/onboarding';

export default function Schedule() {
  const d = useOnboarding();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = validateSchedule({ startDate: d.startDate, hoursText: d.hoursPerDay, requiredText: d.requiredHours });
  const valid = check.ok;

  function finish() {
    if (d.agencyId == null || !check.ok) return;
    const { hoursPerDay: hours, requiredHours: required } = check.values;
    setSaving(true);
    setError(null);
    try {
      const agency = db.select().from(agencies).where(eq(agencies.id, d.agencyId)).get();
      if (!agency) throw new Error('Agency not found');
      const home = d.homeLocationInput ? parseLocation(d.homeLocationInput, REGION_REFERENCE[agency.region]) : null;

      db.transaction((tx) => {
        const user = tx
          .insert(users)
          .values({
            name: d.name.trim(),
            nickname: d.nickname.trim() || null,
            school: d.school.trim() || null,
            course: d.course.trim() || null,
            isStudent: d.isStudent,
            region: agency.region,
          })
          .returning({ id: users.id })
          .get();
        tx.insert(ojtProfile)
          .values({
            userId: user.id,
            agencyId: agency.id,
            homeAddress: d.homeAddress.trim(),
            homeLat: home?.lat ?? null,
            homeLng: home?.lng ?? null,
            homePlusCode: /\+/.test(d.homeLocationInput) ? d.homeLocationInput.trim() : null,
            livingSetup: d.livingSetup,
            startDate: d.startDate,
            hoursPerDay: hours,
            requiredHours: required,
          })
          .run();
        tx.insert(wallets).values({ userId: user.id, name: 'Cash', type: 'cash', balance: 0 }).run();
      });
      d.reset();
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  }

  return (
    <Screen
      insetTop={false}
      title="Your OJT schedule"
      subtitle="Used for cost per day, cost per hour and your projected end date."
      footer={<Button label="Finish" disabled={!valid} loading={saving} onPress={finish} />}
    >
      <StepIndicator step={4} total={4} />
      <DateField label="Start date" value={d.startDate} onChange={(startDate) => d.set({ startDate })} hint="Your first OJT day." />
      <TextField label="Hours per day" value={d.hoursPerDay} onChangeText={(hoursPerDay) => d.set({ hoursPerDay })} keyboardType="decimal-pad" />
      <TextField
        label="Required OJT hours"
        value={d.requiredHours}
        onChangeText={(requiredHours) => d.set({ requiredHours })}
        keyboardType="number-pad"
        placeholder="e.g. 300"
        hint="Ask your school. You can add this later."
      />
      <AppText variant="caption" tone="muted">Workdays: Monday to Friday. Holidays are skipped automatically.</AppText>
      {error ? <AppText>{error}</AppText> : null}
    </Screen>
  );
}
