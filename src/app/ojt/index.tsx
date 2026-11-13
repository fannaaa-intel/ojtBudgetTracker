import { router } from 'expo-router';
import { Appear, AppText, Button, Chip, EmptyState, ListRow, Screen, Section } from '@/components';
import { OjtProgressCard } from '@/features/ojt/components/OjtProgressCard';
import { markWorked, removeOjtDays, useOjtState } from '@/features/ojt/queries';
import { formatDateLabel } from '@/lib/dates';
import { OJT_STATUS_LABEL } from '@/lib/ojt';
import { showSnack } from '@/store/snackbar';

const fmtHours = (h: number) => `${Number.isInteger(h) ? h : h.toFixed(1)} h`;

/** Every workday since the start date. Unlogged days count 0 hours until marked. */
export default function OjtLog() {
  const s = useOjtState();
  if (!s) return null;
  const past = s.unlogged;

  return (
    <Screen
      insetTop={false}
      title="OJT hours"
      subtitle={`Since ${formatDateLabel(s.startDate)}`}
      footer={
        past.length > 0 ? (
          <Button
            label={`Mark ${past.length} unlogged ${past.length === 1 ? 'day' : 'days'} as worked`}
            onPress={() => {
              const dates = [...past];
              markWorked(s.userId, dates, s.hoursPerDay);
              showSnack(`${dates.length} ${dates.length === 1 ? 'day' : 'days'} marked worked`, { label: 'Undo', onPress: () => removeOjtDays(s.userId, dates) });
            }}
          />
        ) : undefined
      }
    >
      <Appear>
        <OjtProgressCard />
      </Appear>
      {past.length > 0 ? (
        <AppText variant="caption" tone="secondary">
          Unlogged days count as 0 hours. Tap one to log it.
        </AppText>
      ) : null}
      {s.timeline.length === 0 ? <EmptyState icon="calendar-outline" message={`Your OJT starts on ${formatDateLabel(s.startDate)}.`} /> : null}
      {s.timeline.length > 0 ? (
        <Section title="Days" icon="calendar-outline">
          {s.timeline.map((e, i) => {
            const status = e.log ? OJT_STATUS_LABEL[e.log.status] : e.kind === 'holiday' ? 'Holiday' : null;
            const subtitle = e.holidayName ?? (e.kind === 'extra' ? 'Day off' : (e.log?.note ?? undefined));
            return (
              <Appear key={e.date} index={i} rise={6}>
                <ListRow
                  title={formatDateLabel(e.date)}
                  subtitle={subtitle || undefined}
                  right={status ? <Chip label={status} status="plain" /> : <Chip label="Not logged" status="outline" />}
                  value={e.log && e.log.hours > 0 ? fmtHours(e.log.hours) : undefined}
                  onPress={() => router.push({ pathname: '/ojt/[date]', params: { date: e.date } })}
                  last={i === s.timeline.length - 1}
                />
              </Appear>
            );
          })}
        </Section>
      ) : null}
    </Screen>
  );
}
