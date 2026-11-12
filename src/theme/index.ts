/**
 * Minimalist monochrome theme. Black, white and greys only — no brand or status colours.
 * Emphasis comes from contrast, weight and fill (inverse), never hue:
 *   - primary action  → inverse fill (black on light, white on dark)
 *   - over budget     → inverse chip "OVER"
 *   - near limit      → outlined chip
 *   - quiet info      → textSecondary / textMuted
 */
import { useColorScheme } from 'react-native';
import { useThemePref } from '@/store/theme';

export type ColorTokens = {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  inverse: string;
  onInverse: string;
  overlay: string;
};

export const lightColors: ColorTokens = {
  background: '#FFFFFF',
  surface: '#F6F6F6',
  surfaceAlt: '#EDEDED',
  border: '#E3E3E3',
  borderStrong: '#0A0A0A',
  text: '#0A0A0A',
  textSecondary: '#5E5E5E',
  textMuted: '#9A9A9A',
  inverse: '#0A0A0A',
  onInverse: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.4)',
};

export const darkColors: ColorTokens = {
  background: '#0A0A0A',
  surface: '#161616',
  surfaceAlt: '#222222',
  border: '#2C2C2C',
  borderStrong: '#F5F5F5',
  text: '#F5F5F5',
  textSecondary: '#A6A6A6',
  textMuted: '#6E6E6E',
  inverse: '#F5F5F5',
  onInverse: '#0A0A0A',
  overlay: 'rgba(0,0,0,0.6)',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
export const hairline = 1;

/**
 * Every style has an explicit lineHeight (~1.3–1.45× the size) so wrapped text breathes
 * instead of stacking tight on small screens.
 */
export const typography = {
  display: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const, letterSpacing: -0.5 },
  title: { fontSize: 22, lineHeight: 29, fontWeight: '600' as const, letterSpacing: -0.3 },
  heading: { fontSize: 17, lineHeight: 23, fontWeight: '600' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  caption: { fontSize: 13, lineHeight: 19, fontWeight: '400' as const },
  label: { fontSize: 11, lineHeight: 16, fontWeight: '600' as const, letterSpacing: 0.8, textTransform: 'uppercase' as const },
  /** Amounts: tabular digits so columns of pesos line up. */
  amount: { fontSize: 17, lineHeight: 23, fontWeight: '600' as const, fontVariant: ['tabular-nums' as const] },
  amountLarge: { fontSize: 36, lineHeight: 44, fontWeight: '700' as const, letterSpacing: -0.5, fontVariant: ['tabular-nums' as const] },
};

export type TypographyVariant = keyof typeof typography;

/** Colours follow Settings → Appearance: System (phone setting), Light or Dark. */
export function useTheme() {
  const system = useColorScheme();
  const pref = useThemePref((s) => s.pref);
  const isDark = (pref === 'system' ? system : pref) === 'dark';
  const colors = isDark ? darkColors : lightColors;
  return { colors, spacing, radius, typography, hairline, isDark };
}
