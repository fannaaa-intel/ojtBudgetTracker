/**
 * Holidays during the OJT period (Proclamation No. 1006, s. 2025, for 2026).
 * Add the 2027 list once Malacañang releases it; Jan 1 is a regular holiday by law.
 */
export const HOLIDAY_SEED: { date: string; name: string; type: 'regular' | 'special' }[] = [
  { date: '2026-11-30', name: 'Bonifacio Day', type: 'regular' },
  { date: '2026-12-08', name: 'Feast of the Immaculate Conception', type: 'special' },
  { date: '2026-12-24', name: 'Christmas Eve', type: 'special' },
  { date: '2026-12-25', name: 'Christmas Day', type: 'regular' },
  { date: '2026-12-30', name: 'Rizal Day', type: 'regular' },
  { date: '2026-12-31', name: 'Last Day of the Year', type: 'special' },
  { date: '2027-01-01', name: "New Year's Day", type: 'regular' },
];
