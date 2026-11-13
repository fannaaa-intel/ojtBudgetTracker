/**
 * Offline location helpers: Plus Code decoding, "lat, lng" parsing, distance estimates.
 * No network, no dependencies. Plus Code logic follows the Open Location Code spec.
 */

export type LatLng = { lat: number; lng: number };

const ALPHABET = '23456789CFGHJMPQRVWX';
const PAIR_RES = [20, 1, 0.05, 0.0025, 0.000125];
const SEPARATOR_POS = 8;

/** Reference points used to recover short Plus Codes like "M24X+CHV". */
export const REGION_REFERENCE: Record<'NCR' | 'REGION_V', LatLng> = {
  NCR: { lat: 14.5995, lng: 120.9842 }, // Manila
  REGION_V: { lat: 14.1122, lng: 122.9553 }, // Daet, Camarines Norte
};

const PLUS_CODE_RE = /([23456789CFGHJMPQRVWX]{2,8}\+[23456789CFGHJMPQRVWX]{0,7})/i;
const LATLNG_RE = /(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/;

function encodePairs(lat: number, lng: number, length: number): string {
  let la = Math.min(Math.max(lat, -90), 90 - 1e-10) + 90;
  let lo = (((lng + 180) % 360) + 360) % 360;
  let code = '';
  for (let i = 0; code.length < length && i < PAIR_RES.length; i++) {
    const res = PAIR_RES.at(i) as number;
    const dLat = Math.floor(la / res);
    const dLng = Math.floor(lo / res);
    la -= dLat * res;
    lo -= dLng * res;
    code += ALPHABET.charAt(dLat) + ALPHABET.charAt(dLng);
  }
  return code.slice(0, length);
}

function decodeFull(code: string): LatLng {
  const clean = code.replace('+', '').replace(/0+$/, '').toUpperCase();
  let lat = -90;
  let lng = -180;
  let latRes = 400;
  let lngRes = 400;
  const pairLen = Math.min(clean.length, 10);
  for (let i = 0; i < pairLen; i += 2) {
    const res = PAIR_RES.at(i / 2) as number;
    latRes = res;
    lngRes = res;
    lat += ALPHABET.indexOf(clean.charAt(i)) * res;
    lng += ALPHABET.indexOf(clean.charAt(i + 1)) * res;
  }
  for (let i = 10; i < clean.length; i++) {
    const idx = ALPHABET.indexOf(clean.charAt(i));
    latRes /= 5;
    lngRes /= 4;
    lat += Math.floor(idx / 4) * latRes;
    lng += (idx % 4) * lngRes;
  }
  return { lat: lat + latRes / 2, lng: lng + lngRes / 2 };
}

/**
 * Decode a full or short Plus Code. Short codes ("M24X+CHV") need a reference point,
 * e.g. REGION_REFERENCE.NCR. Text around the code ("M24X+CHV, Diliman, QC") is ignored.
 */
export function decodePlusCode(input: string, reference?: LatLng): LatLng | null {
  const match = input.match(PLUS_CODE_RE);
  if (!match) return null;
  const code = match[1].toUpperCase();
  const sep = code.indexOf('+');
  if (sep === SEPARATOR_POS) return decodeFull(code);
  if (sep % 2 !== 0 || !reference) return null;

  const padding = SEPARATOR_POS - sep;
  const resolution = Math.pow(20, 2 - padding / 2);
  const half = resolution / 2;
  const prefix = encodePairs(reference.lat, reference.lng, padding);
  const candidate = decodeFull(prefix + code);

  let { lat, lng } = candidate;
  if (reference.lat + half < lat && lat - resolution >= -90) lat -= resolution;
  else if (reference.lat - half > lat && lat + resolution <= 90) lat += resolution;
  if (reference.lng + half < lng) lng -= resolution;
  else if (reference.lng - half > lng) lng += resolution;
  return { lat, lng };
}

/**
 * Encode a point as a full 11-character Plus Code ("7Q63M24X+CHV", ~3 × 3 m).
 * Integer maths in grid units (lat 1/40000°, lng 1/32000°) so float error never flips a digit.
 */
export function encodePlusCode(lat: number, lng: number): string {
  const la = Math.floor((Math.min(Math.max(lat, -90), 90 - 1e-10) + 90) * 40000 + 1e-6);
  const lo = Math.floor(((((lng + 180) % 360) + 360) % 360) * 32000 + 1e-6);
  const LAT_UNITS = [800000, 40000, 2000, 100, 5];
  const LNG_UNITS = [640000, 32000, 1600, 80, 4];
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += ALPHABET.charAt(Math.floor(la / (LAT_UNITS.at(i) as number)) % 20) + ALPHABET.charAt(Math.floor(lo / (LNG_UNITS.at(i) as number)) % 20);
    if (i === 3) code += '+';
  }
  return code + ALPHABET.charAt((la % 5) * 4 + (lo % 4));
}

/** Accepts "14.656, 121.049", a Google Maps URL containing "@14.6,121.0", or a Plus Code. */
export function parseLocation(input: string, reference?: LatLng): LatLng | null {
  const at = input.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (at) return { lat: Number(at[1]), lng: Number(at[2]) };
  const ll = input.match(LATLNG_RE);
  if (ll) return { lat: Number(ll[1]), lng: Number(ll[2]) };
  return decodePlusCode(input, reference);
}

/** Straight-line distance in km. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Rough road distance: straight line × detour factor, one decimal. Always label it "estimate". */
export const ROAD_DETOUR_FACTOR = 1.35;
export function estimateRoadKm(a: LatLng, b: LatLng, factor = ROAD_DETOUR_FACTOR): number {
  return Math.round(haversineKm(a, b) * factor * 10) / 10;
}
