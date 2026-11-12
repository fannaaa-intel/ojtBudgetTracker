import { getTableName } from 'drizzle-orm';
import { getTableConfig, SQLiteTable } from 'drizzle-orm/sqlite-core';
import * as schema from '../src/db/schema';
import { TABLE_NAMES } from '../src/db/tables';
import { backupFileName, buildBackup, RESTORE_ORDER, totalRows, validateBackup } from '../src/lib/backup';

const allTableNames = TABLE_NAMES;

describe('backup', () => {
  const now = new Date('2026-11-12T04:30:00.000Z');

  it('every schema table (28, incl. app_settings and bill_share_payments) goes in the backup', () => {
    expect(allTableNames).toHaveLength(28);
    expect(allTableNames).toContain('bill_share_payments');
    expect(allTableNames).toContain('app_settings');
    const tables = Object.fromEntries(allTableNames.map((n) => [n, [] as unknown[]]));
    const b = buildBackup(tables, { schemaVersion: 3, now, today: '2026-11-12' });
    expect(Object.keys(b.tables)).toEqual(allTableNames);
    expect(Object.keys(b.counts)).toEqual(allTableNames);
  });

  it('keeps money as integer centavos through JSON', () => {
    const b = buildBackup({ transactions: [{ id: 1, amount: 1125, date: '2026-11-12', deleted_at: null }] }, { schemaVersion: 3, now, today: '2026-11-12' });
    const back = JSON.parse(JSON.stringify(b));
    expect(back.tables.transactions[0].amount).toBe(1125);
    expect(Number.isInteger(back.tables.transactions[0].amount)).toBe(true);
    expect(back).toMatchObject({ app: 'ojt-budget-tracker', format: 1, schemaVersion: 3, exportedAt: '2026-11-12T04:30:00.000Z', exportedOn: '2026-11-12' });
  });

  it('restore order covers every table exactly once', () => {
    expect([...RESTORE_ORDER].sort()).toEqual([...allTableNames].sort());
  });

  it('restore order puts every table after the tables its foreign keys point to', () => {
    const pos = new Map(RESTORE_ORDER.map((n, i) => [n as string, i]));
    for (const v of Object.values(schema) as unknown[]) {
      if (!(v instanceof SQLiteTable)) continue;
      const cfg = getTableConfig(v);
      for (const fk of cfg.foreignKeys) {
        const target = getTableName(fk.reference().foreignTable);
        if (target === cfg.name) continue;
        expect([cfg.name, pos.get(cfg.name)! > pos.get(target)!]).toEqual([cfg.name, true]);
      }
    }
  });

  it('validates backups before restoring', () => {
    const good = buildBackup({ users: [{ id: 1 }], transactions: [] }, { schemaVersion: 9, now, today: '2026-11-12' });
    expect(validateBackup(good, 10)).toMatchObject({ ok: true, rows: 1 });
    expect(validateBackup(good, 8)).toMatchObject({ ok: false, error: expect.stringMatching(/newer version/) });
    expect(validateBackup({ app: 'other' }, 10).ok).toBe(false);
    expect(validateBackup(null, 10).ok).toBe(false);
    expect(validateBackup({ ...good, tables: { users: [] } }, 10).ok).toBe(false);
    expect(validateBackup({ ...good, tables: { users: [{ id: 1 }], transactions: 'x' } }, 10).ok).toBe(false);
  });

  it('counts rows and names the file by date', () => {
    const b = buildBackup({ a: [1, 2], b: [3] }, { schemaVersion: 1, now, today: '2026-11-12' });
    expect(b.counts).toEqual({ a: 2, b: 1 });
    expect(totalRows(b)).toBe(3);
    expect(backupFileName('2026-11-12')).toBe('ojt-budget-backup-2026-11-12.json');
  });
});
