/**
 * Holidays during the OJT period. Only days that fall on a workday change anything.
 *   2026: Proclamation No. 1006, s. 2025
 *   2027: Proclamation No. 1427, s. 2026 (signed Sept 8, 2026). Not included: Feb 25 (EDSA) is a
 *         special WORKING day; Eid'l Fitr / Eid'l Adha get their own proclamations later.
 * `region` set = local holiday, only for users in that region. LGU Talisay is the only REGION_V
 * agency, so REGION_V here means Camarines Norte:
 *   - Sept 28 Vinzons Day: every year by Republic Act 6720 (whole province)
 *   - Feb 1 Jose Maria Panganiban Day: RA 11445, "upon proclamation" each year (proclaimed every
 *     year 2023–2025); the 2027 proclamation is expected in January
 * Older installs get new rows through topUpSeed() (added by date, never overwritten).
 */
export const HOLIDAY_SEED: { date: string; name: string; type: 'regular' | 'special'; region?: 'NCR' | 'REGION_V' | null }[] = [
  // 2026
  { date: '2026-11-30', name: 'Bonifacio Day', type: 'regular' },
  { date: '2026-12-08', name: 'Feast of the Immaculate Conception', type: 'special' },
  { date: '2026-12-24', name: 'Christmas Eve', type: 'special' },
  { date: '2026-12-25', name: 'Christmas Day', type: 'regular' },
  { date: '2026-12-30', name: 'Rizal Day', type: 'regular' },
  { date: '2026-12-31', name: 'Last Day of the Year', type: 'special' },
  // 2027 — national
  { date: '2027-01-01', name: "New Year's Day", type: 'regular' },
  { date: '2027-02-06', name: 'Chinese New Year', type: 'special' },
  { date: '2027-03-25', name: 'Maundy Thursday', type: 'regular' },
  { date: '2027-03-26', name: 'Good Friday', type: 'regular' },
  { date: '2027-03-27', name: 'Black Saturday', type: 'special' },
  { date: '2027-04-09', name: 'Araw ng Kagitingan', type: 'regular' },
  { date: '2027-05-01', name: 'Labor Day', type: 'regular' },
  { date: '2027-06-12', name: 'Independence Day', type: 'regular' },
  { date: '2027-08-21', name: 'Ninoy Aquino Day', type: 'special' },
  { date: '2027-08-30', name: 'National Heroes Day', type: 'regular' },
  { date: '2027-11-01', name: "All Saints' Day", type: 'special' },
  { date: '2027-11-02', name: "All Souls' Day", type: 'special' },
  { date: '2027-11-30', name: 'Bonifacio Day', type: 'regular' },
  { date: '2027-12-08', name: 'Feast of the Immaculate Conception', type: 'special' },
  { date: '2027-12-24', name: 'Christmas Eve', type: 'special' },
  { date: '2027-12-25', name: 'Christmas Day', type: 'regular' },
  { date: '2027-12-30', name: 'Rizal Day', type: 'regular' },
  { date: '2027-12-31', name: 'Last Day of the Year', type: 'special' },
  // 2027 — Camarines Norte (LGU Talisay intern only)
  { date: '2027-02-01', name: 'Jose Maria Panganiban Day', type: 'special', region: 'REGION_V' },
  { date: '2027-09-28', name: 'Vinzons Day', type: 'special', region: 'REGION_V' },
];
