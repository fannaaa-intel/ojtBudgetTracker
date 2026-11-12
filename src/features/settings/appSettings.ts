import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { appSettings, type Region } from '@/db/schema';
import { ELECTRICITY_RATE_DEFAULT } from '@/db/seed/settings';
import { useDbQuery } from '@/db/useDbQuery';

/** Known keys. Values are stored as text. */
export type SettingKey =
  | 'electricity_rate' // centavos per kWh
  | 'fares_checked_on' // YYYY-MM-DD
  | 'reminders' // JSON ReminderPrefs (see lib/reminders)
  | 'budget_alerts_sent' // JSON { "<budgetId>:<periodStart>": "near" | "over" }
  | 'lock_biometric' // '1' = fingerprint / Face ID unlock on
  | 'pin_failures' // JSON { n: number, at: epoch ms }
  | 'labels'; // 'taglish' | 'english'

export function getSetting(key: SettingKey): string | null {
  return db.select().from(appSettings).where(eq(appSettings.key, key)).get()?.value ?? null;
}

export function setSetting(key: SettingKey, value: string): void {
  db.insert(appSettings).values({ key, value }).onConflictDoUpdate({ target: appSettings.key, set: { value } }).run();
}

export function deleteSetting(key: SettingKey): void {
  db.delete(appSettings).where(eq(appSettings.key, key)).run();
}

export function useSetting(key: SettingKey): string | null {
  return useDbQuery(() => getSetting(key), ['app_settings'], [key]);
}

/** The user's rate if set, otherwise the region default (null in Bicol until entered). */
export function getElectricityRate(region: Region): { rate: number | null; isDefault: boolean } {
  const saved = Number(getSetting('electricity_rate'));
  if (Number.isInteger(saved) && saved > 0) return { rate: saved, isDefault: false };
  return { rate: ELECTRICITY_RATE_DEFAULT[region], isDefault: true };
}

export function useElectricityRate(region: Region | undefined) {
  return useDbQuery(() => (region ? getElectricityRate(region) : { rate: null, isDefault: true }), ['app_settings'], [region]);
}
