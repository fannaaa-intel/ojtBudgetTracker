/**
 * Local notifications (offline). Plans the next weeks of reminders from the database and
 * schedules them on the phone; budget 80% / 100% alerts are shown the moment they happen.
 * Nothing is sent to or from a server.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { db } from '@/db/client';
import { transactions } from '@/db/schema';
import { and, count, eq } from 'drizzle-orm';
import { billPeriod, dueDateFor } from '@/lib/bills';
import { addDays, isWorkday, todayManila } from '@/lib/dates';
import { FARE_CHECK_DAYS } from '@/lib/fareCheck';
import { budgetAlertsToSend, HORIZON_DAYS, parsePrefs, planReminders, type BudgetLevel, type ReminderPrefs } from '@/lib/reminders';
import { listBillsThisMonth } from '../bills/queries';
import { listBudgetProgress } from '../budgets/queries';
import { getFareCheck } from '../commute/queries';
import { listEssentials } from '../essentials/queries';
import { getOjtState } from '../ojt/queries';
import { getProfile } from '../profile/queries';
import { getSetting, setSetting } from '../settings/appSettings';
import { notDeleted } from '../transactions/queries';

export const CHANNEL_ID = 'reminders';

let configured = false;

/** Show reminders even while the app is open; create the Android channel once. */
export async function configureNotifications(): Promise<void> {
  if (configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 120],
    });
  }
}

export async function notificationsAllowed(): Promise<boolean> {
  const s = await Notifications.getPermissionsAsync();
  return s.granted;
}

/** Ask the phone for permission (Android 13+ / iOS show a prompt once). */
export async function askPermission(): Promise<boolean> {
  const s = await Notifications.requestPermissionsAsync();
  return s.granted;
}

export function getPrefs(): ReminderPrefs {
  return parsePrefs(getSetting('reminders'));
}

export function setPrefs(p: ReminderPrefs): void {
  setSetting('reminders', JSON.stringify(p));
}

function buildPlanInput() {
  const p = getProfile();
  const ojt = getOjtState();
  if (!p || !ojt) return undefined;
  const today = todayManila();
  const loggedToday =
    (db
      .select({ n: count() })
      .from(transactions)
      .where(and(notDeleted(), eq(transactions.date, today)))
      .get()?.n ?? 0) > 0;

  const holidays = new Set(ojt.holidays.keys());
  const ojtWorkdays: string[] = [];
  for (let k = 0; k <= HORIZON_DAYS; k++) {
    const d = addDays(today, k);
    if (d >= ojt.startDate && isWorkday(d, ojt.workdays, holidays)) ojtWorkdays.push(d);
  }

  // Unpaid bills this month + every bill next month.
  const thisMonth = listBillsThisMonth(today);
  const nextPeriod = billPeriod(addDays(`${billPeriod(today)}-28`, 7));
  const bills = [
    ...thisMonth.filter((b) => !b.payment).map((b) => ({ name: b.bill.name, amount: b.bill.amount, dueDate: b.dueDate })),
    ...thisMonth.map((b) => ({ name: b.bill.name, amount: b.bill.amount, dueDate: dueDateFor(nextPeriod, b.bill.dueDay) })),
  ];

  const fare = getFareCheck(p.user.region, today);
  return {
    today,
    nowEpoch: Date.now(),
    prefs: getPrefs(),
    loggedToday,
    ojtWorkdays,
    ojtLoggedToday: ojt.logs.has(today),
    unloggedPast: ojt.unlogged.filter((d) => d !== today).length,
    bills,
    essentials: listEssentials(today).flatMap((e) => (e.due ? [{ name: e.item.name, due: e.due, kind: e.item.kind }] : [])),
    fareCheckOn: fare.last ? addDays(fare.last, FARE_CHECK_DAYS) : today,
  };
}

let running: Promise<void> | null = null;

/** Cancel and re-create every scheduled reminder from current data. Safe to call often. */
export function rescheduleAll(): Promise<void> {
  if (running) return running;
  running = (async () => {
    try {
      if (!(await notificationsAllowed())) return;
      await configureNotifications();
      const input = buildPlanInput();
      await Notifications.cancelAllScheduledNotificationsAsync();
      if (!input) return;
      for (const n of planReminders(input)) {
        await Notifications.scheduleNotificationAsync({
          content: { title: n.title, body: n.body, data: { url: n.url } },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.epoch, channelId: CHANNEL_ID },
        });
      }
    } catch {
      // Notifications are a convenience; never let them break the app.
    } finally {
      running = null;
    }
  })();
  return running;
}

/** Show "Pagkain budget at 80%" / "Gala budget is over" once per budget, period and level. */
export async function checkBudgetAlerts(): Promise<void> {
  try {
    if (!getPrefs().budgets || !(await notificationsAllowed())) return;
    await configureNotifications();
    let sent: Record<string, BudgetLevel> = {};
    try {
      sent = JSON.parse(getSetting('budget_alerts_sent') ?? '{}');
    } catch {
      sent = {};
    }
    const current = listBudgetProgress().map((b) => ({ budgetId: b.budget.id, name: b.name, periodFrom: b.range.from, status: b.status }));
    const alerts = budgetAlertsToSend(current, sent);
    for (const a of alerts) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: a.level === 'over' ? `${a.name} budget is over` : `${a.name} budget at 80%`,
          body: a.level === 'over' ? 'You have spent the whole envelope for this period.' : 'Slow down a little to stay within this period’s envelope.',
          data: { url: '/budget' },
        },
        trigger: null,
      });
      sent[a.key] = a.level;
    }
    if (alerts.length) setSetting('budget_alerts_sent', JSON.stringify(sent));
  } catch {
    // ignore
  }
}
