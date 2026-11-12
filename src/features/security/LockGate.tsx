import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { shouldRelock } from '@/lib/pin';
import { useLock } from '@/store/lock';
import { getPinRecord } from './lock';
import { LockScreen } from './LockScreen';

/**
 * Mounted last in the root layout so it covers everything. Locks again when the app comes back
 * after a minute or more in the background.
 */
export function LockGate() {
  const locked = useLock((s) => s.locked);
  const setLocked = useLock((s) => s.setLocked);
  const since = useRef<number | null>(null);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background') since.current = Date.now();
      if (s === 'active') {
        if (shouldRelock(since.current, Date.now()) && getPinRecord()) setLocked(true);
        since.current = null;
      }
    });
    return () => sub.remove();
  }, [setLocked]);

  return locked ? <LockScreen /> : null;
}
