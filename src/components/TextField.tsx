import { TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';
import { useRevealFocusedInput } from './Screen';

type Props = TextInputProps & { label: string; hint?: string; error?: string | null };

/** Labelled input. On focus it asks its Screen to scroll it above the keyboard. */
export function TextField({ label, hint, error, style, onFocus, ...rest }: Props) {
  const { colors, radius, spacing, typography } = useTheme();
  const reveal = useRevealFocusedInput();
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="label" tone="secondary">
        {label}
      </AppText>
      <TextInput
        placeholderTextColor={colors.textMuted}
        {...rest}
        onFocus={(e) => {
          reveal();
          onFocus?.(e);
        }}
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
