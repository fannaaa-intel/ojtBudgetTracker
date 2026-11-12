/**
 * Money helpers. Store every amount as integer centavos; format only for display.
 * No Intl dependency (Hermes Intl support varies), so formatting is manual.
 */

/** "1,234.50" | "₱1,234.50" | 1234.5 → 123450 centavos. Returns null for invalid input. */
export function toCentavos(input: string | number): number | null {
  if (typeof input === 'number') {
    return Number.isFinite(input) ? Math.round(input * 100) : null;
  }
  const cleaned = input.replace(/[₱,\s]/g, '').replace(/^PHP/i, '');
  if (cleaned === '' || !/^-?\d*(\.\d{0,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? Math.round(value * 100) : null;
}

/** 123450 → "₱1,234.50". Set showSymbol=false for "1,234.50". */
export function formatPeso(centavos: number, opts: { showSymbol?: boolean; hideZeroCents?: boolean } = {}): string {
  const { showSymbol = true, hideZeroCents = false } = opts;
  const negative = centavos < 0;
  const abs = Math.abs(Math.round(centavos));
  const pesos = Math.floor(abs / 100);
  const cents = abs % 100;
  const pesoStr = pesos.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const centStr = hideZeroCents && cents === 0 ? '' : `.${cents.toString().padStart(2, '0')}`;
  return `${negative ? '-' : ''}${showSymbol ? '₱' : ''}${pesoStr}${centStr}`;
}

/** Split an amount into n shares that add back up exactly (remainder goes to the first shares). */
export function splitEvenly(totalCentavos: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(totalCentavos / n);
  const remainder = totalCentavos - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < remainder ? 1 : 0));
}

export function percentOf(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}
