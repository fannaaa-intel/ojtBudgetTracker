/**
 * Backup file format. Pure: no React, no DB. Money stays integer centavos; dates stay strings.
 *
 * {
 *   app: 'ojt-budget-tracker', format: 1, schemaVersion: <applied migrations>,
 *   exportedAt: '2026-11-12T04:30:00.000Z', exportedOn: '2026-11-12',
 *   counts: { users: 1, transactions: 42, … },
 *   tables: { users: [...], transactions: [...], … }
 * }
 */
export const BACKUP_APP = 'ojt-budget-tracker';
export const BACKUP_FORMAT = 1;

export type Backup = {
  app: typeof BACKUP_APP;
  format: typeof BACKUP_FORMAT;
  schemaVersion: number;
  exportedAt: string;
  exportedOn: string;
  counts: Record<string, number>;
  tables: Record<string, unknown[]>;
};

export function buildBackup(tables: Record<string, unknown[]>, meta: { schemaVersion: number; now: Date; today: string }): Backup {
  const names = Object.keys(tables).sort();
  const sorted: Record<string, unknown[]> = {};
  const counts: Record<string, number> = {};
  for (const n of names) {
    sorted[n] = tables[n];
    counts[n] = tables[n].length;
  }
  return {
    app: BACKUP_APP,
    format: BACKUP_FORMAT,
    schemaVersion: meta.schemaVersion,
    exportedAt: meta.now.toISOString(),
    exportedOn: meta.today,
    counts,
    tables: sorted,
  };
}

/** 'ojt-budget-backup-2026-11-12.json' */
export function backupFileName(today: string): string {
  return `ojt-budget-backup-${today}.json`;
}

export function totalRows(b: Pick<Backup, 'counts'>): number {
  return Object.values(b.counts).reduce((s, n) => s + n, 0);
}
