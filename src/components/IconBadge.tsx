import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';
import { useTheme } from '@/theme';

export type IconName = keyof typeof Ionicons.glyphMap;

type Props = {
  name: IconName;
  /** Box size in px (icon is about half). 40 for rows, 56+ for heroes. */
  size?: number;
  /** Filled inverse square (the one strong badge in a group). */
  inverse?: boolean;
  /** Badge sitting on an inverse card: colours swap. */
  onInverse?: boolean;
};

/** A small outlined Ionicons glyph in a rounded square — rhythm for rows and headers, no colour. */
export function IconBadge({ name, size = 40, inverse, onInverse }: Props) {
  const { colors, radius } = useTheme();
  const fill = inverse ? colors.inverse : onInverse ? 'transparent' : colors.surface;
  const ink = inverse ? colors.onInverse : onInverse ? colors.onInverse : colors.text;
  const edge = inverse ? colors.inverse : onInverse ? colors.onInverse : colors.border;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: size >= 56 ? radius.lg : radius.md,
        borderWidth: 1,
        borderColor: edge,
        backgroundColor: fill,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: onInverse ? 0.9 : 1,
      }}
    >
      <Ionicons name={name} size={Math.round(size * 0.5)} color={ink} />
    </View>
  );
}
