/**
 * "Check your fares" rules. Pure: no React, no DB.
 * Fares were last checked on the later of: the newest effective date in the fare table, or the
 * day the intern tapped "Fares still correct" / saved a fare update.
 */
import type { ISODate } from './dates';
import { daysBetween } from './paySchedule';

export const FARE_CHECK_DAYS = 90;

export function lastChecked(newestEffective: ISODate | null, checkedOn: ISODate | null): ISODate | null {
  if (!newestEffective) return checkedOn;
  if (!checkedOn) return newestEffective;
  return checkedOn > newestEffective ? checkedOn : newestEffective;
}

export function fareCheckDue(today: ISODate, last: ISODate | null): boolean {
  return last == null || daysBetween(last, today) >= FARE_CHECK_DAYS;
}

/** Mode groups for the bulk fare update screen. */
export const FARE_GROUPS: { key: string; label: string; match: (mode: string) => boolean }[] = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'jeep', label: 'Jeep', match: (m) => m.startsWith('jeep') },
  { key: 'bus', label: 'Bus', match: (m) => m.startsWith('bus') },
  { key: 'uv', label: 'UV / Van', match: (m) => m.startsWith('uv') },
  { key: 'train', label: 'Train', match: (m) => m === 'lrt1' || m === 'lrt2' || m === 'mrt3' },
  { key: 'other', label: 'Other', match: (m) => ['tricycle', 'tnvs', 'mc_taxi', 'walk'].includes(m) },
];
