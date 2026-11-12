import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

type Props = { title: string; subtitle?: string; meta?: string; selected?: boolean; onPress: () => void };

/** A selectable row (agency picker, living setup, etc.). Selected = strong border + filled radio. */
export function OptionRow({ title, subtitle, meta, selected, onPress }: Props) {
  const { colors, radius, spacing } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radius.md,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? colors.borderStrong : colors.border,
        backgroundColor: colors.background,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: selected ? colors.borderStrong : colors.textMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.inverse }} /> : null}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="heading">{title}</AppText>
        {subtitle ? <AppText variant="caption" tone="secondary">{subtitle}</AppText> : null}
      </View>
      {meta ? <AppText variant="label" tone="muted">{meta}</AppText> : null}
    </Pressable>
  );
}
