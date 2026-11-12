import { TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

type Props = TextInputProps & { label: string; hint?: string; error?: string | null };

export function TextField({ label, hint, error, style, ...rest }: Props) {
  const { colors, radius, spacing, typography } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="label" tone="secondary">
        {label}
      </AppText>
      <TextInput
        placeholderTextColor={colors.textMuted}
        {...rest}
        style={[
          typography.body,
          {
            color: colors.text,
            minHeight: 48,
            paddingHorizontal: spacing.md,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: error ? colors.borderStrong : colors.border,
            backgroundColor: colors.surface,
          },
          style,
        ]}
      />
      {error ? (
        <AppText variant="caption">{error}</AppText>
      ) : hint ? (
        <AppText variant="caption" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
