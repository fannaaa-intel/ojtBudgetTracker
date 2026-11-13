/**
 * Seed top-up: what a phone that installed an older version is missing from the shipped
 * reference data. Pure (no DB). Rules:
 *   - holidays are added by date if missing; existing rows are never changed
 *   - agencies are added by code if missing
 *   - an agency's map pin is filled only where the phone has none (never overwrites)
 * Fares, meal prices and categories are never touched (users edit those).
 */

export type HolidaySeed = { date: string; name: string; type: 'regular' | 'special'; region?: 'NCR' | 'REGION_V' | null };
export type AgencyPin = { code: string; lat: number | null; lng: number | null; plusCode: string | null };

export function missingHolidays<T extends HolidaySeed>(existingDates: Iterable<string>, seed: readonly T[]): T[] {
  const have = new Set(existingDates);
  return seed.filter((h) => !have.has(h.date));
}

export function missingAgencies<T extends { code: string }>(existingCodes: Iterable<string>, seed: readonly T[]): T[] {
  const have = new Set(existingCodes);
  return seed.filter((a) => !have.has(a.code));
}

/** Pins to write: seed has a location, the phone's row has none. */
export function agencyPinUpdates(existing: readonly AgencyPin[], seed: readonly AgencyPin[]): AgencyPin[] {
  const byCode = new Map(seed.map((s) => [s.code, s]));
  const out: AgencyPin[] = [];
  for (const row of existing) {
    const s = byCode.get(row.code);
    if (!s || s.lat == null || s.lng == null) continue;
    if (row.lat != null && row.lng != null) continue;
    out.push({ code: row.code, lat: s.lat, lng: s.lng, plusCode: row.plusCode ?? s.plusCode });
  }
  return out;
}

/** Holidays that apply to a user: national ones (no region) plus their region's local ones. */
export function holidaysFor<T extends { region?: string | null }>(rows: readonly T[], region: string | null | undefined): T[] {
  return rows.filter((h) => h.region == null || h.region === region);
}
