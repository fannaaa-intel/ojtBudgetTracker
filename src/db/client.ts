import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

/** One on-device database. enableChangeListener lets useLiveQuery re-render on writes. */
export const expoDb = openDatabaseSync('ojt-budget.db', { enableChangeListener: true });
expoDb.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(expoDb, { schema });
export type DB = typeof db;
