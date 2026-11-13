import type { ReactNode } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';
import { usePressScale } from './usePressScale';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  label: string;
  /** Second line, e.g. a price on a meal preset chip. */
  detail?: string;
  /** Selectable chips: selected = strong 2px border + bold, like OptionRow. */
  selected?: boolean;
  /**
   * Status chips (not pressable):
   *   'inverse' → "OVER" (100%+), 'outline' → near limit (80%+), 'plain' → quiet info.
   */
  status?: 'inverse' | 'outline' | 'plain';
  onPress?: () => void;
  onLongPress?: () => void;
  accessibilityLabel?: string;
  /** Status chip placed on an inverse surface (e.g. the Home "Today" card): colours swap. */
  onInverse?: boolean;
};

export function Chip({ label, detail, selected, status, onPress, onLongPress, accessibilityLabel, onInverse }: Props) {
  const { colors, radius, spacing, typography } = useTheme();
  const press = usePressScale(0.94);

  if (status) {
    const filled = status === 'inverse';
    const ink = onInverse ? colors.onInverse : colors.borderStrong; // border / fill colour
    const paper = onInverse ? colors.inverse : colors.background; // text on a filled chip
    return (
      <View
        accessibilityLabel={accessibilityLabel ?? label}
        style={{
          alignSelf: 'flex-start',
          paddingHorizontal: spacing.sm,
          paddingVertical: 2,
          borderRadius: radius.pill,
          borderWidth: status === 'plain' ? 0 : 1,
          borderColor: ink,
          backgroundColor: filled ? ink : 'transparent',
        }}
      >
        <AppText
          variant="label"
          tone={status === 'plain' ? (onInverse ? 'inverse' : 'muted') : 'default'}
          style={status === 'plain' ? undefined : { color: filled ? paper : ink }}
        >
          {label}
        </AppText>
      </View>
    );
  }

  return (
    <AnimatedPressable
      accessibilityRole={selected === undefined ? 'button' : 'checkbox'}
      accessibilityState={selected === undefined ? undefined : { checked: selected }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[
        {
          minHeight: 48,
          justifyContent: 'center',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          borderRadius: radius.pill,
          borderWidth: selected ? 2 : 1,
          borderColor: selected ? colors.borderStrong : colors.border,
          backgroundColor: selected ? colors.surfaceAlt : colors.surface,
        },
        press.style,
      ]}
    >
      <AppText style={{ fontWeight: selected ? '600' : '400' }}>{label}</AppText>
      {detail ? (
        <AppText variant="caption" tone="secondary" style={{ fontVariant: typography.amount.fontVariant }}>
          {detail}
        </AppText>
      ) : null}
    </AnimatedPressable>
  );
}

/** Wrapping row of chips. */
export function ChipRow({ children }: { children: ReactNode }) {
  const { spacing } = useTheme();
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>{children}</View>;
}
