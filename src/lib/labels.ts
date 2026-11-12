/**
 * Taglish ↔ English labels. Pure: no React, no DB.
 * Taglish is the default (decision in plan.md); English is a toggle in Settings → Labels.
 */
export type LabelMode = 'taglish' | 'english';

export const WORDS = {
  pamasahe: { taglish: 'Pamasahe', english: 'Fare' },
  pagkain: { taglish: 'Pagkain', english: 'Food' },
  gala: { taglish: 'Gala', english: 'Leisure' },
  utang: { taglish: 'Utang', english: 'Debts' },
  ambagan: { taglish: 'Ambagan', english: 'Group split' },
  barkada: { taglish: 'Barkada', english: 'Friends group' },
  baon: { taglish: 'Baon', english: 'Packed lunch' },
  ambagBahay: { taglish: 'Ambag sa bahay', english: 'Household share' },
} as const satisfies Record<string, Record<LabelMode, string>>;

export type WordKey = keyof typeof WORDS;

export function word(key: WordKey, mode: LabelMode, opts: { lower?: boolean } = {}): string {
  const w = WORDS[key][mode];
  return opts.lower ? w.charAt(0).toLowerCase() + w.slice(1) : w;
}

/** Category keys whose names are Taglish words. Other categories (Meals, Rent…) read the same in both. */
export const CATEGORY_WORDS: Record<string, WordKey> = {
  commute: 'pamasahe',
  food: 'pagkain',
  gala: 'gala',
  bills_ambag_bahay: 'ambagBahay',
};

export function categoryLabel(key: string | null | undefined, dbName: string, mode: LabelMode): string {
  const k = key ? CATEGORY_WORDS[key] : undefined;
  return k ? WORDS[k][mode] : dbName;
}

export function parseLabelMode(v: string | null | undefined): LabelMode {
  return v === 'english' ? 'english' : 'taglish';
}
