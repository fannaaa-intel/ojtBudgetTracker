import { router } from 'expo-router';
import { View } from 'react-native';
import { AppText, Button, Section } from '@/components';
import { OJT_STATUS_LABEL, todayKind } from '@/lib/ojt';
import { showSnack } from '@/store/snackbar';
import { useTheme } from '@/theme';
import { clearOjtDay, setOjtDay, useOjtState } from '../queries';

const fmtHours = (h: number) => `${Number.isInteger(h) ? h : h.toFixed(1)} h`;

/** Home: one tap "Worked today · 5 h", or what was logged, or the holiday name. */
export function OjtTodayCard() {
  const { spacing } = useTheme();
  const s = useOjtState();
  if (!s || s.today < s.startDate) return null;

  const kind = todayKind(s.today, s.workdays, s.holidays);
  const log = s.logs.get(s.today);
  const open = () => router.push({ pathname: '/ojt/[date]', params: { date: s.today } });

  let body;
  if (log) {
    body = (
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}>
        <AppText>
          Logged: {OJT_STATUS_LABEL[log.status]}
          {log.hours > 0 ? ` · ${fmtHours(log.hours)}` : ''}
        </AppText>
        <Button label="Edit" variant="ghost" onPress={open} />
      </View>
    );
  } else if (kind === 'workday') {
    body = (
      <View style={{ gap: spacing.sm }}>
        <Button
          label={`Worked today · ${fmtHours(s.hoursPerDay)}`}
          onPress={() => {
            setOjtDay(s.userId, s.today, 'worked', s.hoursPerDay);
            showSnack(`Logged ${fmtHours(s.hoursPerDay)} for today`, { label: 'Undo', onPress: () => clearOjtDay(s.userId, s.today) });
          }}
        />
        <Button label="WFH, absent or other hours" variant="ghost" onPress={open} />
      </View>
    );
  } else {
    body = (
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}>
        <AppText tone="secondary">{kind === 'holiday' ? `Holiday: ${s.holidays.get(s.today)}` : 'No OJT today'}</AppText>
        <Button label="Log anyway" variant="ghost" onPress={open} />
      </View>
    );
  }

  return (
    <Section title="OJT today" action={s.unlogged.filter((d) => d !== s.today).length > 0 ? <AppText variant="caption">{s.unlogged.filter((d) => d !== s.today).length} past days not logged</AppText> : undefined}>
      <View style={{ paddingVertical: spacing.md }}>{body}</View>
    </Section>
  );
}
