import { Text, type TextProps } from 'react-native';
import { useTheme, type TypographyVariant } from '@/theme';

type Props = TextProps & {
  variant?: TypographyVariant;
  tone?: 'default' | 'secondary' | 'muted' | 'inverse';
};

/**
 * How far each style may grow with the phone's font size. Body text grows freely; styles that are
 * already big (or tiny uppercase labels) are capped so a 130–200% setting wraps instead of overflowing.
 */
const MAX_SCALE: Partial<Record<TypographyVariant, number>> = {
  display: 1.3,
  amountLarge: 1.3,
  title: 1.4,
  label: 1.6,
};

export function AppText({ variant = 'body', tone = 'default', style, maxFontSizeMultiplier, ...rest }: Props) {
  const { colors, typography } = useTheme();
  const color =
    tone === 'secondary' ? colors.textSecondary : tone === 'muted' ? colors.textMuted : tone === 'inverse' ? colors.onInverse : colors.text;
  return <Text maxFontSizeMultiplier={maxFontSizeMultiplier ?? MAX_SCALE[variant]} {...rest} style={[typography[variant], { color }, style]} />;
}
