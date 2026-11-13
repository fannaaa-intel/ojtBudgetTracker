import { AGENCY_SEED } from '../src/db/seed/agencies';
import { decodePlusCode, encodePlusCode, estimateRoadKm, haversineKm, parseLocation, REGION_REFERENCE } from '../src/lib/distance';

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
  it('encodes Plus Codes that decode back to the same spot', () => {
    // NFRDI's centre point encodes to its published code.
    const nfrdi = decodePlusCode('7Q63M24X+CHV')!;
    expect(encodePlusCode(nfrdi.lat, nfrdi.lng)).toBe('7Q63M24X+CHV');
    for (const p of [
      { lat: 14.5626, lng: 121.0231 },
      { lat: 14.5726, lng: 120.9829 },
      { lat: 14.1371, lng: 122.9256 },
    ]) {
      const code = encodePlusCode(p.lat, p.lng);
      expect(code).toMatch(/^[23456789CFGHJMPQRVWX]{8}\+[23456789CFGHJMPQRVWX]{3}$/);
      const back = decodePlusCode(code)!;
      expect(Math.abs(back.lat - p.lat)).toBeLessThan(0.00005);
      expect(Math.abs(back.lng - p.lng)).toBeLessThan(0.00005);
    }
  });
  it('every agency pin decodes inside its city', () => {
    const near: Record<string, { lat: number; lng: number }> = {
      NFRDI: { lat: 14.6507, lng: 121.0494 }, // UP Diliman
      ITC_MAKATI: { lat: 14.5547, lng: 121.0244 }, // Makati CBD
      LANDBANK_PLAZA: { lat: 14.5714, lng: 120.9897 }, // Malate
      LGU_TALISAY: { lat: 14.1356, lng: 122.9244 }, // Talisay town centre
    };
    for (const a of AGENCY_SEED) {
      expect(a.lat).not.toBeNull();
      expect(a.plusCode).not.toBeNull();
      const p = decodePlusCode(a.plusCode!)!;
      expect(Math.abs(p.lat - a.lat!)).toBeLessThan(0.0002);
      expect(haversineKm(p, near[a.code])).toBeLessThan(3);
    }
  });
  it('estimates road km with the detour factor', () => {
    expect(estimateRoadKm({ lat: 14.6561, lng: 121.0489 }, { lat: 14.68, lng: 121.05 })).toBeCloseTo(3.6, 1);
  });
});
