import { create } from 'zustand';
import { expoDb } from '@/db/client';
import { categoryLabel, parseLabelMode, word, type LabelMode, type WordKey } from '@/lib/labels';

function readSaved(): LabelMode {
  try {
    return parseLabelMode(expoDb.getFirstSync<{ value: string }>(`SELECT value FROM app_settings WHERE key = 'labels'`)?.value);
  } catch {
    return 'taglish';
  }
}

type Store = { mode: LabelMode; setMode: (m: LabelMode) => void };

export const useLabelMode = create<Store>((set) => ({ mode: readSaved(), setMode: (mode) => set({ mode }) }));

/** Labels in the user's chosen style: w('pamasahe') → "Pamasahe" or "Fare". */
export function useLabels() {
  const mode = useLabelMode((s) => s.mode);
  return {
    mode,
    w: (key: WordKey, lower = false) => word(key, mode, { lower }),
    cat: (key: string | null | undefined, dbName: string) => categoryLabel(key, dbName, mode),
  };
}

/** For non-React code (snackbars). */
export function labelNow(key: WordKey): string {
  return word(key, useLabelMode.getState().mode);
}
