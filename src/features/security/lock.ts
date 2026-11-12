/**
 * App lock: salted SHA-256 PIN hash in users.pin_hash, optional fingerprint / Face ID,
 * and a wrong-PIN counter that survives restarts. Offline only.
 * Note: the lock protects the app's screens; it does not encrypt the database file.
 */
import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { hashInput, parsePinHash, serializePinHash, toHex } from '@/lib/pin';
import { useLock } from '@/store/lock';
import { deleteSetting, getSetting, setSetting } from '../settings/appSettings';

async function sha256(text: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, text);
}

export function getPinRecord() {
  return parsePinHash(db.select({ h: users.pinHash }).from(users).limit(1).get()?.h);
}

export async function setPin(userId: number, pin: string): Promise<void> {
  const salt = toHex(Crypto.getRandomBytes(16));
  const hash = await sha256(hashInput(salt, pin));
  db.update(users).set({ pinHash: serializePinHash(pin.length, salt, hash) }).where(eq(users.id, userId)).run();
  resetFailures();
}

export function removePin(userId: number): void {
  db.update(users).set({ pinHash: null }).where(eq(users.id, userId)).run();
  deleteSetting('lock_biometric');
  resetFailures();
  useLock.getState().setLocked(false);
}

export async function checkPin(pin: string): Promise<boolean> {
  const rec = getPinRecord();
  if (!rec) return true;
  return (await sha256(hashInput(rec.salt, pin))) === rec.hash;
}

export function getFailures(): { n: number; at: number } {
  try {
    const f = JSON.parse(getSetting('pin_failures') ?? '{}');
    return { n: Number(f.n) || 0, at: Number(f.at) || 0 };
  } catch {
    return { n: 0, at: 0 };
  }
}

export function recordFailure(now = Date.now()): { n: number; at: number } {
  const f = { n: getFailures().n + 1, at: now };
  setSetting('pin_failures', JSON.stringify(f));
  return f;
}

export function resetFailures(): void {
  deleteSetting('pin_failures');
}

export function biometricEnabled(): boolean {
  return getSetting('lock_biometric') === '1';
}

export function setBiometricEnabled(on: boolean): void {
  if (on) setSetting('lock_biometric', '1');
  else deleteSetting('lock_biometric');
}

export async function biometricAvailable(): Promise<boolean> {
  try {
    return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
  } catch {
    return false;
  }
}

export async function biometricUnlock(): Promise<boolean> {
  try {
    const r = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock OJT Budget', cancelLabel: 'Use PIN', disableDeviceFallback: true });
    return r.success;
  } catch {
    return false;
  }
}
