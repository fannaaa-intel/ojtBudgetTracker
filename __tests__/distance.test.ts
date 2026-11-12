import { decodePlusCode, estimateRoadKm, parseLocation, REGION_REFERENCE } from '../src/lib/distance';

describe('distance', () => {
  it('decodes NFRDI short Plus Code near Manila', () => {
    const p = decodePlusCode('M24X+CHV, Vasra, Diliman, Quezon City', REGION_REFERENCE.NCR)!;
    expect(p.lat).toBeCloseTo(14.6561, 3);
    expect(p.lng).toBeCloseTo(121.0489, 3);
  });
  it('decodes a full Plus Code without a reference', () => {
    const p = decodePlusCode('7Q63M24X+CHV')!;
    expect(p.lat).toBeCloseTo(14.6561, 3);
  });
  it('parses "lat, lng" and Google Maps @ URLs', () => {
    expect(parseLocation('14.68, 121.05')).toEqual({ lat: 14.68, lng: 121.05 });
    expect(parseLocation('https://maps.google.com/@14.5,121.0,17z')).toEqual({ lat: 14.5, lng: 121.0 });
  });
  it('estimates road km with the detour factor', () => {
    expect(estimateRoadKm({ lat: 14.6561, lng: 121.0489 }, { lat: 14.68, lng: 121.05 })).toBeCloseTo(3.6, 1);
  });
});
