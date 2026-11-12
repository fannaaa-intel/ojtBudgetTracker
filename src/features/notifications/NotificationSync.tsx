import * as Notifications from 'expo-notifications';
import { addDatabaseChangeListener } from 'expo-sqlite';
import { router, type Href } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { getProfile } from '../profile/queries';
import { askPermission, checkBudgetAlerts, configureNotifications, rescheduleAll } from './scheduler';

/** Tables whose changes affect reminders. */
const WATCHED = new Set(['transactions', 'ojt_days', 'ojt_profile', 'recurring_bills', 'bill_payments', 'restock_items', 'fare_rules', 'app_settings', 'budgets', 'holidays']);

/**
 * Mounted once in the root layout. Keeps scheduled reminders in step with the data,
 * asks for permission once after registration, and opens the right screen when a reminder is tapped.
 */
export function NotificationSync() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let budgetsDirty = false;
    const kick = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        rescheduleAll();
        if (budgetsDirty) checkBudgetAlerts();
        budgetsDirty = false;
      }, 1500);
    };

    (async () => {
      try {
        await configureNotifications();
        const perm = await Notifications.getPermissionsAsync();
        if (!perm.granted && perm.canAskAgain && getProfile()) await askPermission();
      } catch {
        // ignore: reminders are optional
      }
      rescheduleAll();
    })();

    const db = addDatabaseChangeListener(({ tableName }) => {
      if (!WATCHED.has(tableName)) return;
      if (tableName === 'transactions' || tableName === 'budgets') budgetsDirty = true;
      kick();
    });
    const app = AppState.addEventListener('change', (s) => {
      if (s === 'active') kick();
    });
    const tap = Notifications.addNotificationResponseReceivedListener((r) => {
      const url = r.notification.request.content.data?.url;
      if (typeof url === 'string') router.push(url as Href);
    });

    return () => {
      if (timer) clearTimeout(timer);
      db.remove();
      app.remove();
      tap.remove();
    };
  }, []);

  return null;
}
