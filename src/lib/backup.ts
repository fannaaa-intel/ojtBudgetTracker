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

/**
 * Restore order: every table after the tables it references (foreign keys), so inserts never
 * point at missing rows. Delete in the reverse order.
 */
export const RESTORE_ORDER = [
  'agencies',
  'holidays',
  'categories',
  'fare_rules',
  'meal_presets',
  'users',
  'ojt_profile',
  'ojt_days',
  'wallets',
  'income_sources',
  'savings_goals',
  'routes',
  'route_legs',
  'transactions',
  'budgets',
  'recurring_bills',
  'bill_payments',
  'roommates',
  'bill_shares',
  'bill_share_payments',
  'grocery_items',
  'restock_items',
  'debts',
  'barkada',
  'barkada_members',
  'ambagan',
  'ambagan_shares',
  'app_settings',
] as const;

export type BackupCheck = { ok: true; backup: Backup; rows: number } | { ok: false; error: string };

/** Is this a backup this version of the app can restore? */
export function validateBackup(raw: unknown, currentSchemaVersion: number): BackupCheck {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'This file is not an OJT Budget backup.' };
  const b = raw as Partial<Backup>;
  if (b.app !== BACKUP_APP) return { ok: false, error: 'This file is not an OJT Budget backup.' };
  if (b.format !== BACKUP_FORMAT) return { ok: false, error: 'This backup format is not supported.' };
  if (typeof b.schemaVersion !== 'number' || b.schemaVersion > currentSchemaVersion) {
    return { ok: false, error: 'This backup is from a newer version of the app. Update the app first.' };
  }
  if (!b.tables || typeof b.tables !== 'object') return { ok: false, error: 'The backup has no data.' };
  for (const [name, rows] of Object.entries(b.tables)) {
    if (!Array.isArray(rows) || rows.some((r) => !r || typeof r !== 'object')) return { ok: false, error: `The “${name}” data is damaged.` };
  }
  const users = (b.tables as Record<string, unknown[]>).users ?? [];
  if (users.length !== 1) return { ok: false, error: 'The backup must contain exactly one registered intern.' };
  const rows = Object.values(b.tables as Record<string, unknown[]>).reduce((s, r) => s + r.length, 0);
  return { ok: true, backup: b as Backup, rows };
}

export function totalRows(b: Pick<Backup, 'counts'>): number {
  return Object.values(b.counts).reduce((s, n) => s + n, 0);
}
