import { agencyPinUpdates, holidaysFor, missingAgencies, missingHolidays } from '../src/lib/seedTopUp';

describe('seed top-up', () => {
  const seed = [
    { date: '2027-01-01', name: "New Year's Day", type: 'regular' as const },
    { date: '2027-04-09', name: 'Araw ng Kagitingan', type: 'regular' as const },
  ];

  it('adds only holidays the phone does not have', () => {
    expect(missingHolidays(['2027-01-01'], seed).map((h) => h.date)).toEqual(['2027-04-09']);
    expect(missingHolidays(['2027-01-01', '2027-04-09'], seed)).toEqual([]);
    expect(missingHolidays([], seed)).toHaveLength(2);
  });

  it('adds agencies missing by code', () => {
    expect(missingAgencies(['NFRDI'], [{ code: 'NFRDI' }, { code: 'ITC_MAKATI' }])).toEqual([{ code: 'ITC_MAKATI' }]);
  });

  it('fills a pin only where the phone has none, never overwrites', () => {
    const existing = [
      { code: 'NFRDI', lat: 14.6561, lng: 121.0489, plusCode: '7Q63M24X+CHV' },
      { code: 'ITC_MAKATI', lat: null, lng: null, plusCode: null },
      { code: 'LANDBANK_PLAZA', lat: null, lng: null, plusCode: null },
    ];
    const seedPins = [
      { code: 'NFRDI', lat: 1, lng: 1, plusCode: 'X' }, // must not overwrite
      { code: 'ITC_MAKATI', lat: 14.5626, lng: 121.0231, plusCode: '7Q63H26F+22' },
      { code: 'LANDBANK_PLAZA', lat: null, lng: null, plusCode: null }, // seed has nothing
    ];
    expect(agencyPinUpdates(existing, seedPins)).toEqual([{ code: 'ITC_MAKATI', lat: 14.5626, lng: 121.0231, plusCode: '7Q63H26F+22' }]);
  });

  it('local holidays apply only to their region', () => {
    const rows = [
      { date: '2027-01-01', region: null },
      { date: '2027-04-15', region: 'REGION_V' },
    ];
    expect(holidaysFor(rows, 'NCR').map((h) => h.date)).toEqual(['2027-01-01']);
    expect(holidaysFor(rows, 'REGION_V').map((h) => h.date)).toEqual(['2027-01-01', '2027-04-15']);
  });
});
