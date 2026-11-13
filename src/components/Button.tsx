import { ActivityIndicator, Animated, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';
import { usePressScale } from './usePressScale';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * primary = inverse fill (the one strong action per screen); secondary = outline; ghost = text only.
 * Pressing shrinks it slightly (no ripple).
 */
export function Button({ label, variant = 'primary', loading, disabled, style, onPressIn, onPressOut, ...rest }: Props) {
  const { colors, radius, spacing } = useTheme();
  const press = usePressScale(0.97);
  const isPrimary = variant === 'primary';
  const off = disabled || loading;
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      disabled={off}
      {...rest}
      onPressIn={(e) => {
        press.onPressIn();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        press.onPressOut();
        onPressOut?.(e);
      }}
      style={[
        {
          minHeight: 52,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          backgroundColor: isPrimary ? colors.inverse : 'transparent',
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: colors.borderStrong,
          opacity: off ? 0.4 : 1,
        },
        style,
        press.style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.onInverse : colors.text} />
      ) : (
        <AppText variant="heading" tone={isPrimary ? 'inverse' : 'default'} style={{ textAlign: 'center' }}>
          {label}
        </AppText>
      )}
    </AnimatedPressable>
  );
}
