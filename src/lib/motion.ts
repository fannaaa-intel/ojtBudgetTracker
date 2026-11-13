/**
 * Motion rules for the whole app (pure maths, no React). HANDOFF §6:
 * subtle, purposeful, ≤ 300 ms per element, ease-out, off when Reduce Motion is on.
 */
export const MOTION = {
  /** Content fading / rising in on mount. */
  enterMs: 260,
  /** How far content rises while it fades in (px). */
  rise: 10,
  /** Delay between list items appearing one after another. */
  staggerMs: 45,
  /** Only the first few items are staggered; the rest appear with the last one. */
  maxStaggered: 8,
  /** Numbers counting up to a new value. */
  countMs: 300,
  /** Progress bars / chart bars growing to their size. */
  barMs: 300,
  /** Snackbar sliding in / out. */
  snackMs: 220,
} as const;

/** Delay before item `index` appears; capped so long lists don't keep the user waiting. */
export function staggerDelay(index: number, base = 0): number {
  const i = Math.max(0, Math.min(Math.floor(index), MOTION.maxStaggered));
  return base + i * MOTION.staggerMs;
}

/** Cubic ease-out: fast start, gentle stop. t is clamped to 0–1. */
export function easeOutCubic(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - c, 3);
}

/**
 * The value a counting number shows at progress t (0–1).
 * `integer` keeps money in whole centavos at every frame (CLAUDE.md rule 1).
 */
export function countUpValue(from: number, to: number, t: number, integer = true): number {
  const v = from + (to - from) * easeOutCubic(t);
  if (t >= 1) return to;
  return integer ? Math.round(v) : v;
}

/** 0–100 percentage → 0–1 fraction for a bar, clamped. */
export function barScale(pct: number): number {
  if (!Number.isFinite(pct)) return 0;
  return Math.max(0, Math.min(100, pct)) / 100;
}
