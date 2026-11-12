import { FARE_RULE_SEED } from '../src/db/seed/fareRules';
import { FARE_GROUPS, fareCheckDue, lastChecked } from '../src/lib/fareCheck';

describe('fare check', () => {
  it('last checked = later of newest effective date and the check date', () => {
    expect(lastChecked('2026-09-28', null)).toBe('2026-09-28');
    expect(lastChecked('2026-09-28', '2026-11-12')).toBe('2026-11-12');
    expect(lastChecked('2026-12-01', '2026-11-12')).toBe('2026-12-01');
    expect(lastChecked(null, null)).toBeNull();
  });
  it('due after 90 days', () => {
    expect(fareCheckDue('2026-12-26', '2026-09-28')).toBe(false); // 89 days
    expect(fareCheckDue('2026-12-27', '2026-09-28')).toBe(true); // 90 days
    expect(fareCheckDue('2026-11-12', null)).toBe(true);
  });
  it('every seeded fare mode belongs to a group other than "all"', () => {
    for (const r of FARE_RULE_SEED) {
      expect(FARE_GROUPS.filter((g) => g.key !== 'all').some((g) => g.match(r.mode))).toBe(true);
    }
  });
});
