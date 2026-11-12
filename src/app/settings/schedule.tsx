import { router } from 'expo-router';
import { useState } from 'react';
import { AppText, Button, DateField, Screen, TextField } from '@/components';
import { getProfile } from '@/features/profile/queries';
import { updateSchedule } from '@/features/settings/queries';
import { validateSchedule, type ScheduleErrors } from '@/lib/profile';
import { showSnack } from '@/store/snackbar';

export default function EditSchedule() {
  const [p] = useState(() => getProfile());
  const [startDate, setStartDate] = useState(p?.profile.startDate ?? '2026-11-09');
  const [hoursText, setHoursText] = useState(p ? String(p.profile.hoursPerDay) : '5');
  const [requiredText, setRequiredText] = useState(p?.profile.requiredHours != null ? String(p.profile.requiredHours) : '');
  const [errors, setErrors] = useState<ScheduleErrors>({});
  if (!p) return null;

  function save() {
    const r = validateSchedule({ startDate, hoursText, requiredText });
    if (!r.ok) return setErrors(r.errors);
    updateSchedule(p!.user.id, r.values);
    router.back();
    showSnack('OJT schedule saved');
  }

  return (
    <Screen insetTop={false} title="OJT schedule" subtitle="Used for cost per day, cost per hour and your projected end date." footer={<Button label="Save" onPress={save} />}>
      <DateField label="Start date" value={startDate} onChange={setStartDate} />
      {errors.startDate ? <AppText variant="caption">{errors.startDate}</AppText> : null}
      <TextField label="Hours per day" value={hoursText} onChangeText={setHoursText} keyboardType="decimal-pad" error={errors.hours} />
      <TextField label="Required OJT hours" value={requiredText} onChangeText={setRequiredText} keyboardType="number-pad" placeholder="e.g. 300" hint="Ask your school. Leave blank if you don't know yet." error={errors.required} />
      <AppText variant="caption" tone="muted">Workdays: Monday to Friday. Holidays are skipped automatically.</AppText>
    </Screen>
  );
}
