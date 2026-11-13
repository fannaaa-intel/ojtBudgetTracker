import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';
import { IconBadge, type IconName } from './IconBadge';
import { usePressScale } from './usePressScale';

type Props = {
  title: string;
  /** One short line. Extra facts belong on the detail screen, not joined here with "·". */
  subtitle?: string;
  /** Right-hand value, e.g. an amount (tabular digits, never shrunk to fit). */
  value?: string;
  /**
   * Extra status content, e.g. a Chip. Shown under the text (not squeezed next to the title)
   * so long titles and amounts never crowd each other on narrow phones.
   */
  right?: ReactNode;
  /** Small outlined icon in a rounded square on the left. */
  icon?: IconName;
  onPress?: () => void;
  /** Hide the bottom hairline (last row in a group). */
  last?: boolean;
};

/** Tappable list row: icon / title / subtitle / status on the left, value + chevron on the right. */
export function ListRow({ title, subtitle, value, right, icon, onPress, last }: Props) {
  const { colors, spacing } = useTheme();
  const press = usePressScale(0.98);
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      onPressIn={onPress ? press.onPressIn : undefined}
      onPressOut={onPress ? press.onPressOut : undefined}
      style={{ borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.border }}
    >
      {({ pressed }) => (
        <Animated.View
          style={[
            { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 14, opacity: pressed ? 0.7 : 1 },
            press.style,
          ]}
        >
          {icon ? <IconBadge name={icon} /> : null}
          <View style={{ flex: 1, gap: spacing.xs }}>
            <AppText numberOfLines={2}>{title}</AppText>
            {subtitle ? (
              <AppText variant="caption" tone="secondary" numberOfLines={2}>
                {subtitle}
              </AppText>
            ) : null}
            {right ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: 2 }}>{right}</View> : null}
          </View>
          {value ? (
            <AppText variant="amount" style={{ flexShrink: 0, textAlign: 'right' }} numberOfLines={1}>
              {value}
            </AppText>
          ) : null}
          {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ flexShrink: 0 }} /> : null}
        </Animated.View>
      )}
    </Pressable>
  );
}

/** Section label (optional icon) + bordered group of rows. A long label and its action wrap instead of overlapping. */
export function Section({ title, icon, children, action }: { title?: string; icon?: IconName; children: ReactNode; action?: ReactNode }) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.md }}>
      {title || action ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: spacing.md, rowGap: spacing.xs }}>
          {title ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 }}>
              {icon ? <Ionicons name={icon} size={14} color={colors.textMuted} /> : null}
              <AppText variant="label" tone="muted" style={{ flexShrink: 1 }}>
                {title}
              </AppText>
            </View>
          ) : (
            <View />
          )}
          {action ? <View style={{ flexShrink: 1 }}>{action}</View> : null}
        </View>
      ) : null}
      <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.lg }}>{children}</View>
    </View>
  );
}
