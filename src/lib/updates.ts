/**
 * When the app may look for an app update (pure, no React). CLAUDE.md rule 4 exception:
 * the only network use is checking/downloading app updates — never user data.
 *   - automatically only 8:00 PM – 11:59 PM Asia/Manila (after OJT hours, no work interrupted)
 *   - at most once per CHECK_EVERY_MS while the app is open
 *   - the intern can always check by hand in Settings
 */

export const UPDATE_WINDOW = { fromHour: 20, toHour: 24 } as const;
export const CHECK_EVERY_MS = 30 * 60 * 1000;

/** Hour of day (0–23) in Asia/Manila (UTC+8, no DST), whatever the phone's timezone. */
export function manilaHour(now: Date): number {
  return Math.floor(((now.getTime() / 3_600_000 + 8) % 24 + 24) % 24);
}

export function inUpdateWindow(now: Date): boolean {
  const h = manilaHour(now);
  return h >= UPDATE_WINDOW.fromHour && h < UPDATE_WINDOW.toHour;
}

/** Automatic check allowed: inside the window and not checked in the last CHECK_EVERY_MS. */
export function shouldAutoCheck(now: Date, lastCheckMs: number | null): boolean {
  if (!inUpdateWindow(now)) return false;
  return lastCheckMs == null || now.getTime() - lastCheckMs >= CHECK_EVERY_MS;
}
