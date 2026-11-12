import { create } from 'zustand';

export type Snack = { id: number; message: string; actionLabel?: string; onAction?: () => void };

type Store = {
  snack: Snack | null;
  /** Show a message for ~5 s, optionally with an action such as Undo. Replaces any current one. */
  show: (message: string, action?: { label: string; onPress: () => void }) => void;
  hide: (id?: number) => void;
};

let nextId = 1;

export const useSnackbar = create<Store>((set, get) => ({
  snack: null,
  show: (message, action) => set({ snack: { id: nextId++, message, actionLabel: action?.label, onAction: action?.onPress } }),
  hide: (id) => {
    if (id == null || get().snack?.id === id) set({ snack: null });
  },
}));

/** Shortcut for non-React code paths. */
export const showSnack = (message: string, action?: { label: string; onPress: () => void }) =>
  useSnackbar.getState().show(message, action);
