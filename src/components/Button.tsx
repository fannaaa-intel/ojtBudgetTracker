import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

type Props = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
};

/** primary = inverse fill (the one strong action per screen); secondary = outline; ghost = text only. */
export function Button({ label, variant = 'primary', loading, disabled, style, ...rest }: Props) {
  const { colors, radius, spacing } = useTheme();
  const isPrimary = variant === 'primary';
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={off}
      {...rest}
      style={(state) => [
        {
          minHeight: 48,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.lg,
          backgroundColor: isPrimary ? colors.inverse : 'transparent',
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: colors.borderStrong,
          opacity: off ? 0.4 : state.pressed ? 0.7 : 1,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.onInverse : colors.text} />
      ) : (
        <AppText variant="heading" tone={isPrimary ? 'inverse' : 'default'}>
          {label}
        </AppText>
      )}
    </Pressable>
  );
}
