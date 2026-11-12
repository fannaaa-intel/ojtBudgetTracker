/**
 * Fare table edit form ↔ fare_rules values. Pure: no React, no DB.
 * Pesos typed by the user become integer centavos; percentages are whole numbers 0–100.
 */
import { toCentavos } from './money';
import { amountToInput } from './transactions';

export type FareValues = { baseFare: number; baseKm: number; perKm: number; studentPct: number; promoPct: number };
export type FareFormText = { baseFareText: string; baseKmText: string; perKmText: string; studentPctText: string; promoPctText: string };
export type FareFormErrors = Partial<Record<keyof FareFormText, string>>;

export function fareValuesToForm(v: FareValues): FareFormText {
  return {
    baseFareText: amountToInput(v.baseFare),
    baseKmText: String(v.baseKm),
    perKmText: amountToInput(v.perKm),
    studentPctText: String(v.studentPct),
    promoPctText: String(v.promoPct),
  };
}

function pct(text: string): number | null {
  const t = text.trim();
  if (!/^\d{1,3}$/.test(t)) return null;
  const n = Number(t);
  return n <= 100 ? n : null;
}

export function parseFareForm(t: FareFormText): { ok: true; values: FareValues } | { ok: false; errors: FareFormErrors } {
  const errors: FareFormErrors = {};
  const baseFare = toCentavos(t.baseFareText);
  const perKm = toCentavos(t.perKmText);
  const kmText = t.baseKmText.trim().replace(',', '.');
  const baseKm = /^\d+(\.\d+)?$/.test(kmText) ? Number(kmText) : null;
  const studentPct = pct(t.studentPctText);
  const promoPct = pct(t.promoPctText);

  if (baseFare == null || baseFare < 0) errors.baseFareText = 'Enter a fare like 14 or 14.50';
  if (perKm == null || perKm < 0) errors.perKmText = 'Enter an amount like 2 or 2.40';
  if (baseKm == null || baseKm > 50) errors.baseKmText = 'Enter km from 0 to 50';
  if (studentPct == null) errors.studentPctText = 'Whole number 0–100';
  if (promoPct == null) errors.promoPctText = 'Whole number 0–100';

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, values: { baseFare: baseFare!, baseKm: baseKm!, perKm: perKm!, studentPct: studentPct!, promoPct: promoPct! } };
}

/** "₱14.00 first 4 km + ₱2.00/km" — the one-line summary in the fare table. */
export function describeFormula(v: Pick<FareValues, 'baseFare' | 'baseKm' | 'perKm'>, format: (c: number) => string): string {
  if (v.baseFare === 0 && v.baseKm === 0) return `${format(v.perKm)}/km`;
  const first = v.baseKm > 0 ? `${format(v.baseFare)} first ${v.baseKm} km` : `${format(v.baseFare)} base`;
  return v.perKm > 0 ? `${first} + ${format(v.perKm)}/km` : first;
}
