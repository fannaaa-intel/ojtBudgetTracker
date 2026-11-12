/**
 * Region rules (CLAUDE.md rule 7). Pure: no React, no DB.
 * REGION_V = Bicol (LGU Talisay): no MRT/LRT/EDSA Carousel and no barkada/ambagan features.
 */
export type RegionCode = 'NCR' | 'REGION_V';

export const REGION_LABEL: Record<RegionCode, string> = { NCR: 'Metro Manila', REGION_V: 'Bicol' };

/** Fare modes that only exist in Metro Manila. */
export const METRO_ONLY_MODES = ['lrt1', 'lrt2', 'mrt3', 'bus_edsa_carousel'] as const;

export function isModeAllowed(region: RegionCode, mode: string): boolean {
  return region === 'NCR' || !(METRO_ONLY_MODES as readonly string[]).includes(mode);
}

export function featuresFor(region: RegionCode) {
  const metro = region === 'NCR';
  return { trains: metro, carousel: metro, barkada: metro };
}

/** Group features (ambagan, group gala) show only for a Metro Manila user in a same-region barkada. */
export function barkadaVisible(userRegion: RegionCode, barkadaRegion: RegionCode): boolean {
  return featuresFor(userRegion).barkada && userRegion === barkadaRegion;
}
