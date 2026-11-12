import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';

const DURATION_MS = 350;

/**
 * Smooth Light ↔ Dark switch. When the theme changes, a full-screen layer in the OLD background
 * colour sits on top and fades out, so the new colours ease in instead of snapping.
 * Taps pass through; skipped when the phone's Reduce Motion setting is on.
 */
export function ThemeFade() {
  const { colors, isDark } = useTheme();
  const previous = useRef({ isDark, background: colors.background });
  const opacity = useRef(new Animated.Value(0)).current;
  const [cover, setCover] = useState<string | null>(null);

  useEffect(() => {
    const prev = previous.current;
    previous.current = { isDark, background: colors.background };
    if (prev.isDark === isDark) return;

    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled || reduce) return;
        setCover(prev.background);
        opacity.setValue(1);
        Animated.timing(opacity, { toValue: 0, duration: DURATION_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
          if (finished) setCover(null);
        });
      });
    return () => {
      cancelled = true;
    };
  }, [isDark, colors.background, opacity]);

  if (!cover) return null;
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: cover, opacity }]} />;
}
