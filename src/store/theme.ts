import { create } from 'zustand';
import { expoDb } from '@/db/client';
import type { ThemePref } from '@/db/schema';

/**
 * Read the saved theme choice synchronously at startup so the very first frame
 * (including the "loading database" screen) uses the right colours.
 * Falls back to 'system' before the first migration or before registration.
 */
function readSavedPref(): ThemePref {
  try {
    const row = expoDb.getFirstSync<{ theme_pref: string }>('SELECT theme_pref FROM users LIMIT 1');
    return row?.theme_pref === 'light' || row?.theme_pref === 'dark' ? row.theme_pref : 'system';
  } catch {
    return 'system';
  }
}

type Store = { pref: ThemePref; setPref: (p: ThemePref) => void };

export const useThemePref = create<Store>((set) => ({
  pref: readSavedPref(),
  setPref: (pref) => set({ pref }),
}));
