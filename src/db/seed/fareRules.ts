import type { Region } from '../schema';

/**
 * Default fares — the rates in force since Sept 28, 2026 (latest found as of Nov 12, 2026).
 * Every row is editable in the app. Money = centavos. Never hardcode fares elsewhere.
 * Student discount: 20% on jeeps/buses; 50% on LRT/MRT single-journey tickets.
 */
export const FARES_EFFECTIVE_DATE = '2026-09-28';

export const FARE_MODES = [
  'jeep_traditional',
  'jeep_modern',
  'bus_city_ordinary',
  'bus_city_aircon',
  'bus_edsa_carousel',
  'bus_p2p',
  'uv_traditional',
  'uv_modern',
  'bus_provincial_ordinary',
  'bus_provincial_aircon',
  'lrt1',
  'lrt2',
  'mrt3',
  'tricycle',
  'tnvs',
  'mc_taxi',
  'walk',
] as const;
export type FareMode = (typeof FARE_MODES)[number];

type FareSeed = {
  region: Region;
  mode: FareMode;
  label: string;
  baseFare: number;
  baseKm: number;
  perKm: number;
  studentPct: number;
  promoPct: number;
  roundTo: number;
  isFixed: boolean;
  note: string | null;
  source: string;
};

const LTFRB = 'LTFRB/DOTr fare adjustment effective 2026-09-28';

const road = (region: Region, mode: FareMode, label: string, baseFare: number, baseKm: number, perKm: number, note: string | null = null): FareSeed => ({
  region, mode, label, baseFare, baseKm, perKm, studentPct: 20, promoPct: 0, roundTo: 25, isFixed: false, note, source: LTFRB,
});

const fixed = (region: Region, mode: FareMode, label: string, studentPct: number, promoPct: number, note: string, source = 'User-entered'): FareSeed => ({
  region, mode, label, baseFare: 0, baseKm: 0, perKm: 0, studentPct, promoPct, roundTo: 25, isFixed: true, note, source,
});

const ncr: FareSeed[] = [
  road('NCR', 'jeep_traditional', 'Jeep (traditional)', 1400, 4, 200, 'Student minimum ₱11.25'),
  road('NCR', 'jeep_modern', 'Jeep (modern)', 1700, 4, 240, 'Some March reports said ₱2.30/km; verify'),
  road('NCR', 'bus_city_ordinary', 'City bus (ordinary)', 1500, 5, 249),
  road('NCR', 'bus_city_aircon', 'City bus (aircon)', 1800, 5, 298),
  road('NCR', 'bus_edsa_carousel', 'EDSA Carousel', 1800, 5, 298, 'Uses aircon city bus rates; check posted matrix'),
  fixed('NCR', 'bus_p2p', 'P2P bus', 0, 0, 'Fixed fare per route'),
  { ...road('NCR', 'uv_traditional', 'UV Express (traditional)', 0, 0, 260, 'Provisional; most routes charge a fixed fare'), studentPct: 0 },
  { ...road('NCR', 'uv_modern', 'UV Express (modern)', 0, 0, 300, 'Provisional; most routes charge a fixed fare'), studentPct: 0 },
  {
    region: 'NCR', mode: 'lrt1', label: 'LRT-1', baseFare: 1625, baseKm: 0, perKm: 147, studentPct: 50, promoPct: 0, roundTo: 100, isFixed: false,
    note: 'Single ticket ₱20–₱55, beep ₱16–₱52. Prefer the posted station matrix as a fixed fare.', source: 'LRMC fare formula since 2025-04-02',
  },
  fixed('NCR', 'lrt2', 'LRT-2', 50, 50, 'Enter station-to-station fare. 50% promo for all riders since 2026-03-23, "until further notice" — switch promo off when it ends', 'DOTr/LRTA'),
  fixed('NCR', 'mrt3', 'MRT-3', 50, 50, 'Enter station-to-station fare. 50% promo for all riders since 2026-03-23, "until further notice" — switch promo off when it ends', 'DOTr'),
  fixed('NCR', 'tricycle', 'Tricycle', 20, 0, 'Fare set by each city ordinance'),
  fixed('NCR', 'tnvs', 'Grab / TNVS', 0, 0, 'Log the actual amount paid (sedan base ₱65)'),
  fixed('NCR', 'mc_taxi', 'Motorcycle taxi', 0, 0, 'Log the actual amount paid'),
  fixed('NCR', 'walk', 'Walk', 0, 0, '₱0'),
];

const bicol: FareSeed[] = [
  road('REGION_V', 'jeep_traditional', 'Jeep (traditional)', 1400, 4, 200, 'Verify local Bicol fare matrix'),
  { ...road('REGION_V', 'bus_provincial_ordinary', 'Provincial bus (ordinary)', 1200, 5, 220), source: 'LTFRB provincial bus adjustment 2026' },
  { ...road('REGION_V', 'bus_provincial_aircon', 'Provincial bus (aircon)', 0, 0, 245, 'Per km'), source: 'LTFRB provincial bus adjustment 2026' },
  { ...road('REGION_V', 'uv_traditional', 'Van / UV Express', 0, 0, 260, 'Most routes charge a fixed fare'), studentPct: 0 },
  fixed('REGION_V', 'tricycle', 'Tricycle', 20, 0, 'Fare set by the Talisay municipal ordinance'),
  fixed('REGION_V', 'walk', 'Walk', 0, 0, '₱0'),
];

export const FARE_RULE_SEED = [...ncr, ...bicol].map((r) => ({ ...r, effectiveDate: FARES_EFFECTIVE_DATE }));
