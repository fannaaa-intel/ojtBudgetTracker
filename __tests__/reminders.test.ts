import { budgetAlertsToSend, DEFAULT_PREFS, hourLabel, manilaEpoch, parsePrefs, planReminders, type PlanInput } from '../src/lib/reminders';

const base: PlanInput = {
  today: '2026-11-12',
  nowEpoch: manilaEpoch('2026-11-12', 12), // noon Manila
  prefs: DEFAULT_PREFS,
  loggedToday: false,
  ojtWorkdays: ['2026-11-12', '2026-11-13'],
  ojtLoggedToday: false,
  unloggedPast: 2,
  bills: [],
  essentials: [],
  fareCheckOn: null,
};

describe('reminder times', () => {
  it('Manila wall clock → epoch (UTC+8)', () => {
    expect(new Date(manilaEpoch('2026-11-12', 19)).toISOString()).toBe('2026-11-12T11:00:00.000Z');
    expect(new Date(manilaEpoch('2026-11-13', 6)).toISOString()).toBe('2026-11-12T22:00:00.000Z');
  });
  it('labels hours', () => {
    expect(hourLabel(19)).toBe('7:00 PM');
    expect(hourLabel(12)).toBe('12:00 PM');
    expect(hourLabel(0)).toBe('12:00 AM');
  });
  it('parses saved prefs safely', () => {
    expect(parsePrefs(null)).toEqual(DEFAULT_PREFS);
    expect(parsePrefs('not json')).toEqual(DEFAULT_PREFS);
    expect(parsePrefs('{"daily":false,"dailyHour":21}')).toEqual({ ...DEFAULT_PREFS, daily: false, dailyHour: 21 });
    expect(parsePrefs('{"dailyHour":99}').dailyHour).toBe(19);
  });
});

describe('planReminders', () => {
  it('daily 7 PM for 21 days, skipping today when something is logged', () => {
    const all = planReminders({ ...base, prefs: { ...DEFAULT_PREFS, ojt: false } });
    expect(all.filter((n) => n.key.startsWith('daily:'))).toHaveLength(21);
    const skip = planReminders({ ...base, loggedToday: true, prefs: { ...DEFAULT_PREFS, ojt: false } });
    expect(skip[0].key).toBe('daily:2026-11-13');
  });
  it('OJT reminder at 6 PM on workdays, with the unlogged count today', () => {
    const ojt = planReminders(base).filter((n) => n.key.startsWith('ojt:'));
    expect(ojt.map((n) => n.key)).toEqual(['ojt:2026-11-12', 'ojt:2026-11-13']);
    expect(ojt[0].body).toContain('2 earlier days not logged');
    expect(new Date(ojt[0].epoch).toISOString()).toBe('2026-11-12T10:00:00.000Z');
    expect(planReminders({ ...base, ojtLoggedToday: true }).some((n) => n.key === 'ojt:2026-11-12')).toBe(false);
  });
  it('bill the morning before it is due; past times are dropped', () => {
    const n = planReminders({ ...base, prefs: { ...DEFAULT_PREFS, daily: false, ojt: false }, bills: [{ name: 'Rent', amount: 3500_00, dueDate: '2026-11-15' }, { name: 'Wi-Fi', amount: 0, dueDate: '2026-11-12' }] });
    expect(n.map((x) => x.key)).toEqual(['bill:Rent:2026-11-15']);
    expect(n[0].body).toContain('₱3,500.00');
  });
  it('fare check: due already → tomorrow; future → that day', () => {
    const only = { ...DEFAULT_PREFS, daily: false, ojt: false };
    expect(planReminders({ ...base, prefs: only, fareCheckOn: '2026-10-01' })[0].key).toBe('fares:2026-11-13');
    expect(planReminders({ ...base, prefs: only, fareCheckOn: '2026-11-20' })[0].key).toBe('fares:2026-11-20');
  });
  it('everything off → nothing scheduled', () => {
    const off = { daily: false, dailyHour: 19, ojt: false, bills: false, budgets: false, essentials: false, fares: false };
    expect(planReminders({ ...base, prefs: off, fareCheckOn: '2026-11-20' })).toEqual([]);
  });
});

describe('budgetAlertsToSend', () => {
  const cur = [
    { budgetId: 1, name: 'Pagkain', periodFrom: '2026-11-09', status: 'near' as const },
    { budgetId: 2, name: 'Gala', periodFrom: '2026-11-09', status: 'over' as const },
    { budgetId: 3, name: 'Pamasahe', periodFrom: '2026-11-09', status: 'ok' as const },
  ];
  it('sends each level once per period', () => {
    expect(budgetAlertsToSend(cur, {})).toEqual([
      { key: '1:2026-11-09', level: 'near', name: 'Pagkain' },
      { key: '2:2026-11-09', level: 'over', name: 'Gala' },
    ]);
    expect(budgetAlertsToSend(cur, { '1:2026-11-09': 'near', '2:2026-11-09': 'over' })).toEqual([]);
  });
  it('near → over still alerts; a new period starts fresh', () => {
    expect(budgetAlertsToSend([{ ...cur[0], status: 'over' }], { '1:2026-11-09': 'near' })).toEqual([{ key: '1:2026-11-09', level: 'over', name: 'Pagkain' }]);
    expect(budgetAlertsToSend([{ ...cur[0], periodFrom: '2026-11-16' }], { '1:2026-11-09': 'over' })).toHaveLength(1);
  });
});
