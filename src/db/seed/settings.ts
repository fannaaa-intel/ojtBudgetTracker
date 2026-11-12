import type { Region } from '../schema';

/**
 * Default electricity rate, centavos per kWh. Editable in Settings → Electricity rate.
 * NCR: Meralco residential rate, Oct 2026 (₱15.06/kWh). Bicol: none — each electric co-op
 * (e.g. CANORECO) has its own rate, so the user enters it; we never guess.
 */
export const ELECTRICITY_RATE_DEFAULT: Record<Region, number | null> = { NCR: 1506, REGION_V: null };
export const ELECTRICITY_RATE_SOURCE: Record<Region, string> = {
  NCR: 'Meralco residential rate, Oct 2026',
  REGION_V: 'Enter your electric co-op’s rate (see your latest bill)',
};
