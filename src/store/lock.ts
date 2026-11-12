import { create } from 'zustand';
import { expoDb } from '@/db/client';

/** Read synchronously at startup so a locked app never flashes its screens. */
function pinIsSet(): boolean {
  try {
    return !!expoDb.getFirstSync<{ pin_hash: string | null }>('SELECT pin_hash FROM users LIMIT 1')?.pin_hash;
  } catch {
    return false;
  }
}

type Store = { locked: boolean; setLocked: (locked: boolean) => void };

export const useLock = create<Store>((set) => ({
  locked: pinIsSet(),
  setLocked: (locked) => set({ locked }),
}));
