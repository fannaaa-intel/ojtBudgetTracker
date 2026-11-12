import { CATEGORY_SEED } from '../src/db/seed/categories';
import { AMBAGAN_KINDS, ambaganSplit, utangTotals, validateDebt } from '../src/lib/barkada';
import { barkadaVisible, featuresFor } from '../src/lib/region';

describe('ambagan split', () => {
  it('equal among members + me, leftover centavo to me', () => {
    expect(ambaganSplit(1000_00, 'equal', [0, 0])).toEqual({ ok: true, mine: 33334, members: [33333, 33333] });
  });
  it('custom: my share is what is left', () => {
    expect(ambaganSplit(1500_00, 'custom', [500_00, 400_00])).toEqual({ ok: true, mine: 600_00, members: [500_00, 400_00] });
  });
  it('custom shares above the total are rejected with a member wording', () => {
    const r = ambaganSplit(500_00, 'custom', [300_00, 300_00]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/^Members’/);
  });
  it('every ambagan kind logs to a seeded Gala category', () => {
    const keys = new Set(CATEGORY_SEED.map((c) => c.key));
    for (const k of AMBAGAN_KINDS) expect(keys.has(k.categoryKey)).toBe(true);
  });
});

describe('utang', () => {
  it('totals open debts only', () => {
    expect(
      utangTotals([
        { amount: 200_00, direction: 'owed_to_me', settledAt: null },
        { amount: 50_00, direction: 'owed_to_me', settledAt: '2026-11-10' },
        { amount: 120_00, direction: 'i_owe', settledAt: null },
      ]),
    ).toEqual({ owedToMe: 200_00, iOwe: 120_00, net: 80_00 });
  });
  it('validates', () => {
    expect(validateDebt({ person: 'Ana', amountText: '150' })).toEqual({ ok: true, amount: 15000 });
    expect(validateDebt({ person: ' ', amountText: '0' }).ok).toBe(false);
  });
});

describe('region gate', () => {
  it('barkada features: Metro Manila only, same-region barkada only', () => {
    expect(featuresFor('NCR').barkada).toBe(true);
    expect(featuresFor('REGION_V').barkada).toBe(false);
    expect(barkadaVisible('NCR', 'NCR')).toBe(true);
    expect(barkadaVisible('REGION_V', 'REGION_V')).toBe(false);
  });
});
