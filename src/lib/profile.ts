/** Profile and OJT schedule rules, shared by onboarding and Settings. Pure: no React, no DB. */
import { isValidISO } from './dates';

export const MIN_NAME_LENGTH = 2;
export const MAX_HOURS_PER_DAY = 12;

export function isValidName(name: string): boolean {
  return name.trim().length >= MIN_NAME_LENGTH;
}

export type ScheduleDraft = { startDate: string; hoursText: string; requiredText: string };
export type ScheduleErrors = Partial<Record<'startDate' | 'hours' | 'required', string>>;
export type ScheduleValues = { startDate: string; hoursPerDay: number; requiredHours: number | null };

export function validateSchedule(d: ScheduleDraft): { ok: true; values: ScheduleValues } | { ok: false; errors: ScheduleErrors } {
  const errors: ScheduleErrors = {};
  const hoursText = d.hoursText.trim().replace(',', '.');
  const hours = /^\d+(\.\d+)?$/.test(hoursText) ? Number(hoursText) : NaN;
  const reqText = d.requiredText.trim();
  const required = reqText === '' ? null : /^\d+$/.test(reqText) ? Number(reqText) : NaN;

  if (!isValidISO(d.startDate)) errors.startDate = 'Choose your start date';
  if (!(hours > 0 && hours <= MAX_HOURS_PER_DAY)) errors.hours = `Between 0 and ${MAX_HOURS_PER_DAY} hours`;
  if (required !== null && !(required > 0)) errors.required = 'Whole hours, e.g. 300 — or leave blank';

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, values: { startDate: d.startDate, hoursPerDay: hours, requiredHours: required } };
}

/** Changing agency across regions (Metro Manila ↔ Bicol) affects fares, routes and group features. */
export function regionChangeWarning(from: 'NCR' | 'REGION_V', to: 'NCR' | 'REGION_V'): string | null {
  if (from === to) return null;
  return to === 'REGION_V'
    ? 'Bicol has no LRT/MRT or EDSA Carousel and no barkada or ambagan features. Your saved routes use Metro Manila fares and will need updating.'
    : 'Your saved routes use Bicol fares and will need updating with Metro Manila fares.';
}
