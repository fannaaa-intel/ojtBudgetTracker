import { parseTags, serializeTags, toggleTag } from '../src/lib/tags';
import { amountToInput, validateTxDraft, walletBalance } from '../src/lib/transactions';

describe('tags', () => {
  it('parses, trims, lowercases and dedupes', () => {
    expect(parseTags(' late, Rainy,,late ')).toEqual(['late', 'rainy']);
    expect(parseTags(null)).toEqual([]);
    expect(parseTags('')).toEqual([]);
  });
  it('serializes to a comma list or null', () => {
    expect(serializeTags(['late', 'baon'])).toBe('late,baon');
    expect(serializeTags([])).toBeNull();
    expect(serializeTags(['late', 'LATE'])).toBe('late');
  });
  it('toggles a tag on and off', () => {
    expect(toggleTag(['late'], 'rainy')).toEqual(['late', 'rainy']);
    expect(toggleTag(['late', 'rainy'], 'late')).toEqual(['rainy']);
  });
});

describe('validateTxDraft', () => {
  const base = { kind: 'expense' as const, amountText: '85.50', date: '2026-11-12', categoryId: 9, walletId: 1 };

  it('accepts a valid expense and returns centavos', () => {
    expect(validateTxDraft(base)).toEqual({ ok: true, amount: 8550 });
    expect(validateTxDraft({ ...base, amountText: '₱1,234.5' })).toEqual({ ok: true, amount: 123450 });
  });
  it('rejects zero, negative, invalid and huge amounts', () => {
    for (const amountText of ['', '0', 'abc', '-5', '1.234', '2000000']) {
      const r = validateTxDraft({ ...base, amountText });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.errors.amount).toBeDefined();
    }
  });
  it('requires a category for expenses but not income', () => {
    const exp = validateTxDraft({ ...base, categoryId: null });
    expect(exp.ok).toBe(false);
    if (!exp.ok) expect(exp.errors.category).toBeDefined();
    expect(validateTxDraft({ ...base, kind: 'income', categoryId: null }).ok).toBe(true);
  });
  it('requires a real date and a wallet', () => {
    const r = validateTxDraft({ ...base, date: '2026-02-30', walletId: null });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['date', 'wallet']);
  });
});

describe('amount helpers', () => {
  it('turns centavos back into input text', () => {
    expect(amountToInput(8000)).toBe('80');
    expect(amountToInput(8550)).toBe('85.50');
    expect(amountToInput(1125)).toBe('11.25');
  });
  it('derives a wallet balance from opening + income − expenses', () => {
    expect(walletBalance(50000, 200000, 125075)).toBe(124925);
  });
});
