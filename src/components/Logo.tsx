import { Image } from 'react-native';
import { useTheme } from '@/theme';

const MARK = require('../../assets/brand/logo-mark.png');

/**
 * The OJT Budget wallet mark. The image is a one-colour shape on a transparent background,
 * tinted with the theme text colour: black in light mode, off-white in dark mode.
 * The clasp hole and bar gaps stay transparent, so they show the background in both modes.
 */
export function Logo({ size = 56, accessibilityLabel = 'OJT Budget' }: { size?: number; accessibilityLabel?: string }) {
  const { colors } = useTheme();
  return (
    <Image
      source={MARK}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      resizeMode="contain"
      style={{ width: size, height: size, tintColor: colors.text }}
    />
  );
}
