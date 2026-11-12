import { Pressable, Switch, View } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

type Props = { label: string; description?: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean };

/** Label + switch on one 48 px row. Monochrome: on = inverse track, off = grey track. */
export function ToggleRow({ label, description, value, onChange, disabled }: Props) {
  const { colors, spacing } = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onChange(!value)}
      style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.md, opacity: disabled ? 0.4 : 1 }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <AppText>{label}</AppText>
        {description ? (
          <AppText variant="caption" tone="secondary">
            {description}
          </AppText>
        ) : null}
      </View>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onChange}
        trackColor={{ false: colors.surfaceAlt, true: colors.inverse }}
        thumbColor={value ? colors.onInverse : colors.textMuted}
        ios_backgroundColor={colors.surfaceAlt}
      />
    </Pressable>
  );
}
