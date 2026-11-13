import { useEffect, useState } from 'react';
import { Linking, View } from 'react-native';
import { AppText, Button, Chip, ChipRow, Screen, Section, ToggleRow } from '@/components';
import { askPermission, getPrefs, notificationsAllowed, rescheduleAll, setPrefs } from '@/features/notifications/scheduler';
import { hourLabel, type ReminderPrefs } from '@/lib/reminders';
import { useTheme } from '@/theme';

const HOURS = [18, 19, 20, 21];

/** Turn each reminder on/off and pick the daily reminder time. All reminders are local (offline). */
export default function Reminders() {
  const { spacing } = useTheme();
  const [prefs, setState] = useState<ReminderPrefs>(() => getPrefs());
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    notificationsAllowed().then(setAllowed).catch(() => setAllowed(false));
  }, []);

  const update = (patch: Partial<ReminderPrefs>) => {
    const next = { ...prefs, ...patch };
    setState(next);
    setPrefs(next);
    rescheduleAll();
  };

  return (
    <Screen insetTop={false} title="Reminders" subtitle="On this phone. They work offline.">
      {allowed === false ? (
        <View style={{ gap: spacing.sm }}>
          <AppText tone="secondary">Notifications are off for this app.</AppText>
          <Button
            label="Allow notifications"
            onPress={async () => {
              const ok = await askPermission();
              setAllowed(ok);
              if (ok) rescheduleAll();
              else Linking.openSettings();
            }}
          />
        </View>
      ) : null}

      <Section title="Daily">
        <View style={{ paddingVertical: spacing.sm, gap: spacing.sm }}>
          <ToggleRow label="Log today’s spending" description="Skipped on days you already logged something." value={prefs.daily} onChange={(daily) => update({ daily })} />
          {prefs.daily ? (
            <ChipRow>
              {HOURS.map((h) => (
                <Chip key={h} label={hourLabel(h)} selected={prefs.dailyHour === h} onPress={() => update({ dailyHour: h })} />
              ))}
            </ChipRow>
          ) : null}
          <ToggleRow label="OJT hours not logged" description="6:00 PM on workdays you haven’t logged, with how many earlier days are missing." value={prefs.ojt} onChange={(ojt) => update({ ojt })} />
        </View>
      </Section>

      <Section title="Money">
        <View style={{ paddingVertical: spacing.sm, gap: spacing.sm }}>
          <ToggleRow label="Bills due" description="8:00 AM the day before each due date." value={prefs.bills} onChange={(bills) => update({ bills })} />
          <ToggleRow label="Budget at 80% and 100%" description="Once per budget each week or month." value={prefs.budgets} onChange={(budgets) => update({ budgets })} />
          <ToggleRow label="Essentials running out" description="Toiletries, laundry, load expiry and more — on the day." value={prefs.essentials} onChange={(essentials) => update({ essentials })} />
          <ToggleRow label="Check fares every 90 days" description="A nudge to compare with the posted fare matrix." value={prefs.fares} onChange={(fares) => update({ fares })} />
        </View>
      </Section>
    </Screen>
  );
}
