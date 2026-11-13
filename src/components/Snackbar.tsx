import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MOTION } from '@/lib/motion';
import { useSnackbar, type Snack } from '@/store/snackbar';
import { useTheme } from '@/theme';
import { AppText } from './AppText';
import { reduceMotionNow } from './useReduceMotion';

const VISIBLE_MS = 5000;
/** Keeps the bar above the tab bar / pinned footer buttons. */
const BOTTOM_OFFSET = 72;
const SLIDE = 24;

/** Mounted once in the root layout. Inverse bar with an optional action (Undo). Slides up in, slides down out. */
export function Snackbar() {
  const { colors, radius, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const snack = useSnackbar((s) => s.snack);
  const hide = useSnackbar((s) => s.hide);
  // Keep the last snack on screen while it slides out.
  const [shown, setShown] = useState<Snack | null>(snack);
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const instant = reduceMotionNow();
    if (snack) {
      setShown(snack);
      v.setValue(instant ? 1 : 0);
      if (!instant) Animated.timing(v, { toValue: 1, duration: MOTION.snackMs, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      const t = setTimeout(() => hide(snack.id), VISIBLE_MS);
      return () => clearTimeout(t);
    }
    if (instant) {
      setShown(null);
      return;
    }
    Animated.timing(v, { toValue: 0, duration: MOTION.snackMs, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
      if (finished) setShown(null);
    });
  }, [snack, hide, v]);

  if (!shown) return null;

  return (
    <Animated.View
      pointerEvents={snack ? 'box-none' : 'none'}
      style={{
        position: 'absolute',
        left: spacing.lg,
        right: spacing.lg,
        bottom: insets.bottom + BOTTOM_OFFSET,
        opacity: v,
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [SLIDE, 0] }) }],
      }}
    >
      <Animated.View
        accessibilityLiveRegion="polite"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          minHeight: 52,
          paddingLeft: spacing.lg,
          paddingRight: spacing.xs,
          borderRadius: radius.md,
          backgroundColor: colors.inverse,
        }}
      >
        <AppText tone="inverse" style={{ flex: 1, paddingVertical: spacing.md }}>
          {shown.message}
        </AppText>
        {shown.actionLabel ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              shown.onAction?.();
              hide(shown.id);
            }}
            style={({ pressed }) => ({ minHeight: 48, minWidth: 64, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md, opacity: pressed ? 0.6 : 1 })}
          >
            <AppText variant="label" tone="inverse" style={{ textDecorationLine: 'underline' }}>
              {shown.actionLabel}
            </AppText>
          </Pressable>
        ) : null}
      </Animated.View>
    </Animated.View>
  );
}
