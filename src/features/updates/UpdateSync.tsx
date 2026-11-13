import { useEffect } from 'react';
import { AppState } from 'react-native';
import { shouldAutoCheck } from '@/lib/updates';
import { checkForAppUpdate, lastUpdateCheck, updatesAvailable } from './appUpdate';

/**
 * Mounted once in the root layout. When the app is opened (or comes back to the front) between
 * 8 PM and 12 AM Manila time, quietly checks for an app update — at most every 30 minutes.
 */
export function UpdateSync() {
  useEffect(() => {
    if (!updatesAvailable()) return;
    const maybeCheck = () => {
      if (shouldAutoCheck(new Date(), lastUpdateCheck())) void checkForAppUpdate(false);
    };
    maybeCheck();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') maybeCheck();
    });
    return () => sub.remove();
  }, []);
  return null;
}
