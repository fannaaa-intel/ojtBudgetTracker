/**
 * App updates through EAS Update (expo-updates). The only network use in the app (CLAUDE.md rule 4
 * exception): ask Expo "is there a newer version of the app code?" and download it. No user data
 * is ever sent. The new version runs after a restart; the database is untouched.
 * In Expo Go and dev builds updates are disabled → status 'unavailable'.
 */
import * as Updates from 'expo-updates';
import { create } from 'zustand';
import { showSnack } from '@/store/snackbar';

export type UpdateStatus = 'idle' | 'unavailable' | 'checking' | 'downloading' | 'ready' | 'latest' | 'error';

export const useUpdateStatus = create<{ status: UpdateStatus; set: (s: UpdateStatus) => void }>((set) => ({
  status: 'idle',
  set: (status) => set({ status }),
}));

let lastCheckMs: number | null = null;
export const lastUpdateCheck = () => lastCheckMs;

export function updatesAvailable(): boolean {
  return Updates.isEnabled && !__DEV__;
}

export function restartIntoUpdate(): void {
  Updates.reloadAsync().catch(() => showSnack('Close and reopen the app to finish the update.'));
}

/**
 * Check, and download if there is something new. `manual` = the intern tapped the Settings row:
 * then "you're up to date" and network errors are shown too; automatic checks stay silent.
 */
export async function checkForAppUpdate(manual: boolean): Promise<void> {
  const { status, set } = useUpdateStatus.getState();
  if (!updatesAvailable()) {
    set('unavailable');
    if (manual) showSnack('Updates work in the installed app, not in Expo Go.');
    return;
  }
  if (status === 'checking' || status === 'downloading') return;
  if (status === 'ready') {
    if (manual) restartIntoUpdate();
    return;
  }
  lastCheckMs = Date.now();
  set('checking');
  try {
    const found = await Updates.checkForUpdateAsync();
    if (!found.isAvailable) {
      set('latest');
      if (manual) showSnack('You have the latest version.');
      return;
    }
    set('downloading');
    await Updates.fetchUpdateAsync();
    set('ready');
    showSnack('Update ready. Restart to use it.', { label: 'Restart', onPress: restartIntoUpdate });
  } catch {
    set('error');
    if (manual) showSnack('Could not check for updates. Check your internet and try again.');
  }
}
