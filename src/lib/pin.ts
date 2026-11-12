/**
 * App lock rules. Pure: no React, no DB, no crypto (hashing happens in the feature layer).
 * Stored form of the PIN: "v1$<length>$<salt hex>$<sha256 hex of salt + pin>" in users.pin_hash.
 * The PIN keeps people out of the app's screens; it does not encrypt the database.
 */
export const PIN_MIN = 4;
export const PIN_MAX = 6;
export const MAX_TRIES = 5;
export const LOCKOUT_MS = 30_000;
export const LOCK_AFTER_MS = 60_000;

export function validatePin(pin: string): string | null {
  if (!/^\d+$/.test(pin)) return 'Use numbers only';
  if (pin.length < PIN_MIN || pin.length > PIN_MAX) return `Use ${PIN_MIN} to ${PIN_MAX} digits`;
  return null;
}

export function hashInput(salt: string, pin: string): string {
  return `${salt}:${pin}`;
}

export function serializePinHash(length: number, salt: string, hash: string): string {
  return `v1$${length}$${salt}$${hash}`;
}

export function parsePinHash(stored: string | null | undefined): { length: number; salt: string; hash: string } | null {
  if (!stored) return null;
  const [v, len, salt, hash] = stored.split('$');
  const length = Number(len);
  if (v !== 'v1' || !Number.isInteger(length) || length < PIN_MIN || length > PIN_MAX || !salt || !hash) return null;
  return { length, salt, hash };
}

/** After MAX_TRIES wrong PINs, wait LOCKOUT_MS before trying again. */
export function lockoutLeft(failures: number, lastFailAt: number, now: number): number {
  if (failures < MAX_TRIES) return 0;
  return Math.max(0, lastFailAt + LOCKOUT_MS - now);
}

/** Lock again when the app was in the background for at least a minute. */
export function shouldRelock(backgroundSince: number | null, now: number): boolean {
  return backgroundSince != null && now - backgroundSince >= LOCK_AFTER_MS;
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
