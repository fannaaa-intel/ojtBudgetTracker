import { addDatabaseChangeListener } from 'expo-sqlite';
import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { msUntilManilaMidnight } from '@/lib/dates';

/**
 * Runs a synchronous Drizzle read (.get()/.all()) and re-runs it whenever any of the
 * listed tables changes. Unlike drizzle's useLiveQuery it has data on the first render
 * and it watches joined tables too.
 *
 * @param run     synchronous read, e.g. () => listTransactions({ limit: 5 })
 * @param tables  SQL table names to watch, e.g. ['transactions', 'categories']
 * @param deps    values the read depends on (like useMemo deps)
 */
export function useDbQuery<T>(run: () => T, tables: readonly string[], deps: readonly unknown[] = []): T {
  const [version, setVersion] = useState(0);
  const tableKey = tables.join(',');

  useEffect(() => {
    const watched = new Set(tableKey.split(','));
    const sub = addDatabaseChangeListener(({ tableName }) => {
      if (watched.has(tableName)) setVersion((v) => v + 1);
    });
    // Coming back to the app re-reads too, so "today" rolls over after midnight.
    const app = AppState.addEventListener('change', (s) => {
      if (s === 'active') setVersion((v) => v + 1);
    });
    // ...and so does midnight (Asia/Manila) while the app stays open, so Today never shows yesterday.
    let timer: ReturnType<typeof setTimeout>;
    const atMidnight = () => {
      timer = setTimeout(() => {
        setVersion((v) => v + 1);
        atMidnight();
      }, msUntilManilaMidnight() + 1000);
    };
    atMidnight();
    return () => {
      sub.remove();
      app.remove();
      clearTimeout(timer);
    };
  }, [tableKey]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(run, [version, tableKey, ...deps]);
}
