import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

type Props = {
  title: string;
  subtitle?: string;
  /** Right-hand value, e.g. an amount (rendered with tabular digits). */
  value?: string;
  /**
   * Extra status content, e.g. a Chip or a spinner. Shown under the text (not squeezed next to
   * the title) so long titles and amounts never crowd each other on narrow phones.
   */
  right?: ReactNode;
  onPress?: () => void;
  /** Hide the bottom hairline (last row in a group). */
  last?: boolean;
};

/** Tappable list row: title / subtitle / status on the left, value + chevron on the right. */
export function ListRow({ title, subtitle, value, right, onPress, last }: Props) {
  const { colors, spacing } = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <View style={{ flex: 1, gap: spacing.xs }}>
        <AppText numberOfLines={2}>{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" tone="secondary" numberOfLines={3}>
            {subtitle}
          </AppText>
        ) : null}
        {right ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: 2 }}>{right}</View> : null}
      </View>
      {value ? (
        <AppText variant="amount" style={{ flexShrink: 0, maxWidth: '45%', textAlign: 'right' }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
          {value}
        </AppText>
      ) : null}
      {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ flexShrink: 0 }} /> : null}
    </Pressable>
  );
}

/** Section label + bordered group of rows. A long label and its action wrap instead of overlapping. */
export function Section({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      {title || action ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: spacing.md, rowGap: 2 }}>
          {title ? (
            <AppText variant="label" tone="muted" style={{ flexShrink: 1 }}>
              {title}
            </AppText>
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
