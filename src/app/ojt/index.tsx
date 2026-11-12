import { router } from 'expo-router';
import { AppText, Button, Chip, ListRow, Screen, Section } from '@/components';
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
      subtitle={`${fmtHours(s.hoursDone)} logged${s.requiredHours ? ` of ${s.requiredHours} h` : ''} · since ${formatDateLabel(s.startDate)}`}
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
      <OjtProgressCard linkToLog={false} />
      {past.length > 0 ? (
        <AppText variant="caption" tone="secondary">
          Days you haven’t logged count as 0 hours. Tap a day to log it, or mark them all as worked ({fmtHours(s.hoursPerDay)} each).
        </AppText>
      ) : null}
      {s.timeline.length === 0 ? <AppText tone="secondary">Your OJT starts on {formatDateLabel(s.startDate)}.</AppText> : null}
      {s.timeline.length > 0 ? (
        <Section>
          {s.timeline.map((e, i) => {
            const status = e.log ? OJT_STATUS_LABEL[e.log.status] : e.kind === 'holiday' ? 'Holiday' : null;
            const subtitle = [e.holidayName, e.kind === 'extra' ? 'Day off' : null, e.log?.note].filter(Boolean).join(' · ') || undefined;
            return (
              <ListRow
                key={e.date}
                title={formatDateLabel(e.date)}
                subtitle={subtitle}
                right={status ? <Chip label={status} status="plain" /> : <Chip label="Not logged" status="outline" />}
                value={e.log && e.log.hours > 0 ? fmtHours(e.log.hours) : undefined}
                onPress={() => router.push({ pathname: '/ojt/[date]', params: { date: e.date } })}
                last={i === s.timeline.length - 1}
              />
            );
          })}
        </Section>
      ) : null}
    </Screen>
  );
}
