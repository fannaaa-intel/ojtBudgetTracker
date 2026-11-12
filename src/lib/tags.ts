/**
 * Transaction tags, stored as one comma-separated text column ("late,rainy").
 * Pure helpers: no React, no DB.
 */
export const TX_TAGS = ['late', 'rainy', 'baon'] as const;
export type TxTag = (typeof TX_TAGS)[number];

/** "late, Rainy,,late" → ['late', 'rainy'] (trimmed, lowercase, no duplicates, order kept). */
export function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const out: string[] = [];
  for (const part of raw.split(',')) {
    const tag = part.trim().toLowerCase();
    if (tag && !out.includes(tag)) out.push(tag);
  }
  return out;
}

/** ['late', 'rainy'] → "late,rainy"; empty → null (so the column stays NULL). */
export function serializeTags(tags: readonly string[]): string | null {
  const clean = parseTags(tags.join(','));
  return clean.length ? clean.join(',') : null;
}

export function toggleTag(tags: readonly string[], tag: string): string[] {
  return tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
}
