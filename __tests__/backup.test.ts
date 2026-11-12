import { TABLE_NAMES } from '../src/db/tables';
import { backupFileName, buildBackup, totalRows } from '../src/lib/backup';

const allTableNames = TABLE_NAMES;

describe('backup', () => {
  const now = new Date('2026-11-12T04:30:00.000Z');

  it('the schema has 26 tables and every one goes in the backup', () => {
    expect(allTableNames).toHaveLength(26);
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

  it('counts rows and names the file by date', () => {
    const b = buildBackup({ a: [1, 2], b: [3] }, { schemaVersion: 1, now, today: '2026-11-12' });
    expect(b.counts).toEqual({ a: 2, b: 1 });
    expect(totalRows(b)).toBe(3);
    expect(backupFileName('2026-11-12')).toBe('ojt-budget-backup-2026-11-12.json');
  });
});
