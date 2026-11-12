import type { Region } from '../schema';

/**
 * The 4 OJT agencies users choose from at registration.
 * Interns: NFRDI 2, LGU Talisay 1, ITC Bldg 2, LANDBANK Plaza 1.
 * lat/lng: only NFRDI is known (decoded from its Plus Code M24X+CHV).
 * TODO(open question): add the Google Maps pin for the other three so distance estimates work.
 */
export const AGENCY_SEED: {
  code: string;
  name: string;
  shortName: string;
  address: string;
  city: string;
  province: string | null;
  region: Region;
  lat: number | null;
  lng: number | null;
  plusCode: string | null;
}[] = [
  {
    code: 'NFRDI',
    name: 'National Fisheries Research and Development Institute',
    shortName: 'NFRDI',
    address: 'M24X+CHV, Vasra, Diliman, Quezon City, Metro Manila',
    city: 'Quezon City',
    province: null,
    region: 'NCR',
    lat: 14.6561,
    lng: 121.0489,
    plusCode: '7Q63M24X+CHV',
  },
  {
    code: 'LGU_TALISAY',
    name: 'Local Government Unit of Talisay',
    shortName: 'LGU Talisay',
    address: 'Poblacion, Talisay, Camarines Norte',
    city: 'Talisay',
    province: 'Camarines Norte',
    region: 'REGION_V', // Bicol Region
    lat: null,
    lng: null,
    plusCode: null,
  },
  {
    code: 'ITC_MAKATI',
    name: 'ITC Building',
    shortName: 'ITC Bldg, Gil Puyat Ave',
    address: 'Suite 202, ITC Building, 337 Sen. Gil Puyat Ave., Makati City, Metro Manila',
    city: 'Makati',
    province: null,
    region: 'NCR',
    lat: null,
    lng: null,
    plusCode: null,
  },
  {
    code: 'LANDBANK_PLAZA',
    name: 'LANDBANK Plaza',
    shortName: 'LANDBANK Plaza, Malate',
    address: '1598 M.H. Del Pilar cor. Dr. J. Quintos Sts., Malate, Manila',
    city: 'Manila',
    province: null,
    region: 'NCR',
    lat: null,
    lng: null,
    plusCode: null,
  },
];
