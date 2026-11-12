import { Text, type TextProps } from 'react-native';
import { useTheme, type TypographyVariant } from '@/theme';

type Props = TextProps & {
  variant?: TypographyVariant;
  tone?: 'default' | 'secondary' | 'muted' | 'inverse';
};

export function AppText({ variant = 'body', tone = 'default', style, ...rest }: Props) {
  const { colors, typography } = useTheme();
  const color =
    tone === 'secondary' ? colors.textSecondary : tone === 'muted' ? colors.textMuted : tone === 'inverse' ? colors.onInverse : colors.text;
  return <Text {...rest} style={[typography[variant], { color }, style]} />;
}
