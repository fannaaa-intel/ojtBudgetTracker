import { create } from 'zustand';

/** Draft kept in memory while the user walks through registration. Saved to SQLite on the last step. */
export type OnboardingDraft = {
  name: string;
  nickname: string;
  school: string;
  course: string;
  isStudent: boolean;
  agencyId: number | null;
  homeAddress: string;
  homeLocationInput: string; // pasted pin, "lat, lng" or Plus Code
  livingSetup: 'home' | 'renting' | 'dorm';
  startDate: string; // YYYY-MM-DD
  hoursPerDay: string; // text while editing
  requiredHours: string;
};

type Store = OnboardingDraft & {
  set: (patch: Partial<OnboardingDraft>) => void;
  reset: () => void;
};

const initial: OnboardingDraft = {
  name: '',
  nickname: '',
  school: '',
  course: '',
  isStudent: true,
  agencyId: null,
  homeAddress: '',
  homeLocationInput: '',
  livingSetup: 'home',
  startDate: '2026-11-09',
  hoursPerDay: '5',
  requiredHours: '',
};

export const useOnboarding = create<Store>((set) => ({
  ...initial,
  set: (patch) => set(patch),
  reset: () => set(initial),
}));
