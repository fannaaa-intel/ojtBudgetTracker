import { isValidName, regionChangeWarning, validateSchedule } from '../src/lib/profile';

describe('profile rules', () => {
  it('names need at least 2 characters', () => {
    expect(isValidName(' J ')).toBe(false);
    expect(isValidName('Jo')).toBe(true);
  });

  it('accepts a valid schedule; required hours optional', () => {
    expect(validateSchedule({ startDate: '2026-11-09', hoursText: '5', requiredText: '' })).toEqual({
      ok: true,
      values: { startDate: '2026-11-09', hoursPerDay: 5, requiredHours: null },
    });
    expect(validateSchedule({ startDate: '2026-11-09', hoursText: '7,5', requiredText: '486' })).toEqual({
      ok: true,
      values: { startDate: '2026-11-09', hoursPerDay: 7.5, requiredHours: 486 },
    });
  });

  it('rejects a bad date, hours out of range and non-whole required hours', () => {
    const r = validateSchedule({ startDate: '2026-02-30', hoursText: '13', requiredText: '30.5' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['hours', 'required', 'startDate']);
    expect(validateSchedule({ startDate: '2026-11-09', hoursText: '0', requiredText: '' }).ok).toBe(false);
    expect(validateSchedule({ startDate: '2026-11-09', hoursText: '5', requiredText: '0' }).ok).toBe(false);
  });

  it('warns only when the region changes', () => {
    expect(regionChangeWarning('NCR', 'NCR')).toBeNull();
    expect(regionChangeWarning('NCR', 'REGION_V')).toMatch(/no LRT\/MRT/);
    expect(regionChangeWarning('REGION_V', 'NCR')).toMatch(/Metro Manila fares/);
  });
});
