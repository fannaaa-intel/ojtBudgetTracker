import { getTableName } from 'drizzle-orm';
import { SQLiteTable } from 'drizzle-orm/sqlite-core';
import * as schema from './schema';

/** SQL names of every table in the schema, sorted (used by backup export). */
export const TABLE_NAMES: string[] = (Object.values(schema) as unknown[])
  .filter((v): v is SQLiteTable => v instanceof SQLiteTable)
  .map((t) => getTableName(t))
  .sort();
