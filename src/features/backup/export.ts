/**
 * Backup export: every table → one JSON file → the phone's share sheet (save to Files/Drive,
 * send to yourself, …). Offline: the file is written locally; where it goes is the user's choice.
 * Rows are exported as stored (snake_case columns, centavos, 'YYYY-MM-DD'), ready for a future restore.
 */
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { expoDb } from '@/db/client';
import { TABLE_NAMES } from '@/db/tables';
import { backupFileName, buildBackup, totalRows } from '@/lib/backup';
import { todayManila } from '@/lib/dates';

export function readAllTables(): Record<string, unknown[]> {
  return Object.fromEntries(TABLE_NAMES.map((name) => [name, expoDb.getAllSync(`SELECT * FROM "${name}"`)]));
}

export function appliedMigrations(): number {
  try {
    return expoDb.getFirstSync<{ n: number }>('SELECT COUNT(*) AS n FROM __drizzle_migrations')?.n ?? 0;
  } catch {
    return 0;
  }
}

export async function exportBackup(): Promise<{ fileName: string; rows: number }> {
  const today = todayManila();
  const backup = buildBackup(readAllTables(), { schemaVersion: appliedMigrations(), now: new Date(), today });
  const fileName = backupFileName(today);

  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.create();
  file.writeSync(JSON.stringify(backup, null, 2)); // finish writing before the share sheet opens

  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this phone');
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Save or send your backup', UTI: 'public.json' });
  return { fileName, rows: totalRows(backup) };
}
