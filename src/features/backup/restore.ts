/**
 * Restore a backup JSON: replaces ALL data on this phone.
 * Safety first: the current data is saved to a file in the app's documents folder before anything
 * changes, and the whole restore runs in one transaction that is rolled back if any row or foreign
 * key is wrong — so a bad file leaves the phone exactly as it was.
 */
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { db, expoDb } from '@/db/client';
import { topUpSeed } from '@/db/seed';
import { buildBackup, RESTORE_ORDER, validateBackup, type Backup } from '@/lib/backup';
import { todayManila } from '@/lib/dates';
import { parseLabelMode } from '@/lib/labels';
import { useLabelMode } from '@/store/labels';
import { useLock } from '@/store/lock';
import { useThemePref } from '@/store/theme';
import { appliedMigrations, readAllTables } from './export';

export type PickedBackup = { backup: Backup; rows: number; fileName: string };

/** Let the user choose a backup file and check it. Returns null if they cancel. */
export async function pickBackup(): Promise<PickedBackup | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true, multiple: false });
  if (res.canceled || !res.assets?.length) return null;
  const asset = res.assets[0];
  let raw: unknown;
  try {
    raw = JSON.parse(await new File(asset.uri).text());
  } catch {
    throw new Error('That file is not a readable backup (not JSON).');
  }
  const check = validateBackup(raw, appliedMigrations());
  if (!check.ok) throw new Error(check.error);
  return { backup: check.backup, rows: check.rows, fileName: asset.name };
}

/** Save the current data (before a restore or an erase). Returns the file name. */
export function saveSafetyBackup(reason: 'before-restore' | 'before-erase'): string {
  const now = new Date();
  const stamp = `${todayManila()}-${now.getTime()}`;
  const backup = buildBackup(readAllTables(), { schemaVersion: appliedMigrations(), now, today: todayManila() });
  const file = new File(Paths.document, `ojt-budget-${reason}-${stamp}.json`);
  file.create();
  file.writeSync(JSON.stringify(backup));
  return file.name;
}

function columnsOf(table: string): Set<string> {
  return new Set(expoDb.getAllSync<{ name: string }>(`PRAGMA table_info("${table}")`).map((c) => c.name));
}

/** Replace every table with the backup's rows. Throws (and changes nothing) on any problem. */
export function restoreBackup(backup: Backup): void {
  expoDb.execSync('PRAGMA foreign_keys = OFF;');
  try {
    expoDb.withTransactionSync(() => {
      for (const t of [...RESTORE_ORDER].reverse()) expoDb.runSync(`DELETE FROM "${t}"`);
      for (const t of RESTORE_ORDER) {
        const rows = (backup.tables[t] ?? []) as Record<string, unknown>[];
        if (rows.length === 0) continue;
        const known = columnsOf(t);
        for (const row of rows) {
          // Only columns this version knows; columns added since the backup keep their defaults.
          const cols = Object.keys(row).filter((c) => known.has(c));
          if (cols.length === 0) continue;
          const sql = `INSERT INTO "${t}" (${cols.map((c) => `"${c}"`).join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`;
          expoDb.runSync(sql, cols.map((c) => row[c] as string | number | null));
        }
      }
      const broken = expoDb.getAllSync('PRAGMA foreign_key_check');
      if (broken.length > 0) throw new Error('The backup has links that do not match (foreign keys). Nothing was changed.');
    });
  } finally {
    expoDb.execSync('PRAGMA foreign_keys = ON;');
  }
  // An older backup may lack newer holidays / agency pins: add them back (never overwrites).
  topUpSeed(db);
  // A restored copy never carries a PIN (that is how "Forgot PIN → erase → restore" gets back in),
  // and the lock / wrong-PIN state starts fresh.
  expoDb.runSync('UPDATE users SET pin_hash = NULL');
  expoDb.runSync(`DELETE FROM app_settings WHERE key IN ('lock_biometric', 'pin_failures')`);
  useLock.getState().setLocked(false);
  // Re-apply the restored theme choice right away.
  const pref = expoDb.getFirstSync<{ theme_pref: string }>('SELECT theme_pref FROM users LIMIT 1')?.theme_pref;
  useThemePref.getState().setPref(pref === 'light' || pref === 'dark' ? pref : 'system');
  useLabelMode.getState().setMode(parseLabelMode(expoDb.getFirstSync<{ value: string }>(`SELECT value FROM app_settings WHERE key = 'labels'`)?.value));
}

/** Erase everything the user entered (keeps the shipped fares, categories, agencies, holidays). */
export function eraseAllData(): void {
  const keep = new Set(['agencies', 'holidays', 'categories', 'fare_rules', 'meal_presets']);
  expoDb.execSync('PRAGMA foreign_keys = OFF;');
  try {
    expoDb.withTransactionSync(() => {
      for (const t of [...RESTORE_ORDER].reverse()) if (!keep.has(t)) expoDb.runSync(`DELETE FROM "${t}"`);
    });
  } finally {
    expoDb.execSync('PRAGMA foreign_keys = ON;');
  }
  useThemePref.getState().setPref('system');
  useLabelMode.getState().setMode('taglish');
  useLock.getState().setLocked(false);
}
