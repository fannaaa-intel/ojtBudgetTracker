import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Animated, Pressable, View } from 'react-native';
import { PIN_MAX } from '@/lib/pin';
import { useTheme } from '@/theme';
import { AppText } from './AppText';
import { usePressScale } from './usePressScale';

type Props = {
  value: string;
  onChange: (v: string) => void;
  /** Number of dots to show (the PIN length when unlocking; up to 6 while setting one). */
  dots: number;
  disabled?: boolean;
  /** Shows a fingerprint key in the bottom-left corner. */
  onBiometric?: () => void;
};

function Key({ label, icon, onPress, disabled, accessibilityLabel }: { label?: string; icon?: keyof typeof Ionicons.glyphMap; onPress?: () => void; disabled?: boolean; accessibilityLabel: string }) {
  const { colors, typography } = useTheme();
  const press = usePressScale(0.9);
  if (!onPress) return <View style={{ width: 72, height: 72 }} />;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={{ opacity: disabled ? 0.3 : 1 }}
    >
      <Animated.View
        style={[
          { width: 72, height: 72, borderRadius: 36, borderWidth: label ? 1 : 0, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
          press.style,
        ]}
      >
        {label ? <AppText style={[typography.title, { fontVariant: ['tabular-nums'] }]}>{label}</AppText> : <Ionicons name={icon!} size={26} color={colors.text} />}
      </Animated.View>
    </Pressable>
  );
}

/** Monochrome number pad with PIN dots. No ripple; press-shrink + haptic tick. */
export function PinPad({ value, onChange, dots, disabled, onBiometric }: Props) {
  const { colors, spacing } = useTheme();
  const add = (d: string) => value.length < PIN_MAX && onChange(value + d);
  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
  ];
  return (
    <View style={{ alignItems: 'center', gap: spacing.xl }}>
      <View accessible accessibilityLabel={`${value.length} of ${dots} digits entered`} style={{ flexDirection: 'row', gap: spacing.md, height: 16 }}>
        {Array.from({ length: dots }, (_, i) => (
          <View key={i} style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: colors.borderStrong, backgroundColor: i < value.length ? colors.inverse : 'transparent' }} />
        ))}
      </View>
      <View style={{ gap: spacing.md }}>
        {rows.map((r) => (
          <View key={r[0]} style={{ flexDirection: 'row', gap: spacing.xl }}>
            {r.map((d) => (
              <Key key={d} label={d} accessibilityLabel={d} disabled={disabled} onPress={() => add(d)} />
            ))}
          </View>
        ))}
        <View style={{ flexDirection: 'row', gap: spacing.xl }}>
          <Key icon="finger-print-outline" accessibilityLabel="Use fingerprint" disabled={disabled} onPress={onBiometric} />
          <Key label="0" accessibilityLabel="0" disabled={disabled} onPress={() => add('0')} />
          <Key icon="backspace-outline" accessibilityLabel="Delete" disabled={disabled || value.length === 0} onPress={() => onChange(value.slice(0, -1))} />
        </View>
      </View>
    </View>
  );
}
