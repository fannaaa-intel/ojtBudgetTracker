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
  /** Extra right-hand content, e.g. a status Chip. */
  right?: ReactNode;
  onPress?: () => void;
  /** Hide the bottom hairline (last row in a group). */
  last?: boolean;
};

/** Tappable list row: title/subtitle left, value + chevron right. 48 px minimum. */
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
        paddingVertical: spacing.sm,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <AppText numberOfLines={1}>{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" tone="secondary" numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right}
      {value ? <AppText variant="amount">{value}</AppText> : null}
      {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null}
    </Pressable>
  );
}

/** Section label + bordered group of rows. */
export function Section({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      {title || action ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {title ? <AppText variant="label" tone="muted">{title}</AppText> : <View />}
          {action}
        </View>
      ) : null}
      <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.lg }}>{children}</View>
    </View>
  );
}
