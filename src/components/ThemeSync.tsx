import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Appearance } from 'react-native';
import { useThemePref } from '@/store/theme';
import { useTheme } from '@/theme';

/**
 * Keeps native pieces in step with the in-app theme choice:
 *  - Appearance override → date picker dialogs, alerts and the keyboard follow Light/Dark
 *  - root view background → no white flash behind screens or the keyboard in dark mode
 * Mounted once in the root layout; renders nothing.
 */
export function ThemeSync() {
  const pref = useThemePref((s) => s.pref);
  const { colors } = useTheme();

  useEffect(() => {
    try {
      Appearance.setColorScheme(pref === 'system' ? 'auto' : pref);
    } catch {
      // Older native module: the JS theme still switches; only native dialogs keep the phone setting.
    }
  }, [pref]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
  }, [colors.background]);

  return null;
}
