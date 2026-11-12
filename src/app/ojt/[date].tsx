import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { AppText, Button, Chip, ChipRow, Screen, TextField } from '@/components';
import { clearOjtDay, getOjtState, setOjtDay } from '@/features/ojt/queries';
import { formatDateLabel, isValidISO } from '@/lib/dates';
import { countsHours, normalizeLogHours, OJT_STATUS_LABEL, type OjtStatus } from '@/lib/ojt';
import { showSnack } from '@/store/snackbar';
import { useTheme } from '@/theme';

const STATUSES: OjtStatus[] = ['worked', 'wfh', 'absent', 'holiday'];

/** Log one OJT day: status, hours, note. */
export default function OjtDayScreen() {
  const { spacing } = useTheme();
  const { date } = useLocalSearchParams<{ date: string }>();
  const [s] = useState(() => getOjtState());
  const log = s?.logs.get(date);
  const holidayName = s?.holidays.get(date);
  const [status, setStatus] = useState<OjtStatus>(log?.status ?? (holidayName ? 'holiday' : 'worked'));
  const [hoursText, setHoursText] = useState(String(log && log.hours > 0 ? log.hours : (s?.hoursPerDay ?? 5)));
  const [note, setNote] = useState(log?.note ?? '');
  const [error, setError] = useState<string | null>(null);

  if (!s || !isValidISO(date)) return null;

  function save() {
    const r = normalizeLogHours(status, hoursText);
    if (!r.ok) return setError(r.error);
    setOjtDay(s!.userId, date, status, r.hours, note.trim() || null);
    router.back();
    showSnack(`${formatDateLabel(date)}: ${OJT_STATUS_LABEL[status]}${r.hours > 0 ? ` · ${r.hours} h` : ''}`);
  }

  return (
    <Screen insetTop={false} title={formatDateLabel(date)} subtitle={holidayName ? `Holiday: ${holidayName}` : undefined} footer={<Button label="Save" onPress={save} />}>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="label" tone="secondary">
          Status
        </AppText>
        <ChipRow>
          {STATUSES.map((st) => (
            <Chip key={st} label={OJT_STATUS_LABEL[st]} selected={status === st} onPress={() => (setStatus(st), setError(null))} />
          ))}
        </ChipRow>
      </View>
      {countsHours(status) ? (
        <TextField label="Hours" value={hoursText} onChangeText={(t) => (setHoursText(t), setError(null))} keyboardType="decimal-pad" error={error} hint={`Your usual day is ${s.hoursPerDay} h.`} />
      ) : (
        <AppText variant="caption" tone="muted">{OJT_STATUS_LABEL[status]} days count 0 hours.</AppText>
      )}
      <TextField label="Note (optional)" value={note} onChangeText={setNote} placeholder="e.g. Field visit, half day" />
      {log ? (
        <Button
          label="Clear this day"
          variant="ghost"
          onPress={() => {
            clearOjtDay(s.userId, date);
            router.back();
            showSnack('Day cleared', { label: 'Undo', onPress: () => setOjtDay(s.userId, date, log.status, log.hours, log.note ?? null) });
          }}
        />
      ) : null}
    </Screen>
  );
}
