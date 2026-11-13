import { useEffect, useLayoutEffect, useRef, useState, type ComponentRef, type RefObject } from 'react';
import { Animated, Easing, StyleSheet, type View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { useTheme } from '@/theme';
import { reduceMotionNow } from './useReduceMotion';

const DURATION_MS = 450;
const EASE = Easing.bezier(0.4, 0, 0.2, 1); // standard "ease in-out" — slow start, slow finish

type Controller = (apply: () => void) => void;
let controller: Controller | null = null;

/**
 * Switch the theme with a real cross-fade: snapshot the current screen, lay it on top, apply the
 * new theme underneath, then fade the snapshot out. Falls back to an instant switch if needed.
 */
export function transitionTheme(apply: () => void): void {
  if (controller) controller(apply);
  else apply();
}

/**
 * Mounted once in the root layout, next to (not inside) the view it captures.
 * - Taps in Settings → Appearance use the snapshot cross-fade (transitionTheme).
 * - A change coming from the phone (System mode) uses a soft fade from the old background.
 * Both are skipped when the phone's Reduce Motion setting is on. Taps pass through the overlay.
 */
export function ThemeFade({ target }: { target: RefObject<ComponentRef<typeof View> | null> }) {
  const { colors, isDark } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const busy = useRef(false); // a snapshot transition is running
  const pendingApply = useRef<(() => void) | null>(null);
  const previous = useRef({ isDark, background: colors.background });

  const fadeOut = (done: () => void) =>
    Animated.timing(opacity, { toValue: 0, duration: DURATION_MS, easing: EASE, useNativeDriver: true }).start(() => done());

  // Snapshot cross-fade for taps in Settings.
  useEffect(() => {
    controller = (apply) => {
      if (reduceMotionNow() || busy.current) return apply();
      busy.current = true;
      captureRef(target, { format: 'jpg', quality: 0.92, result: 'tmpfile' })
        .then((uri) => {
          pendingApply.current = apply;
          opacity.setValue(1);
          setSnapshot(uri); // the theme is applied once the snapshot is on screen (onLoad below)
        })
        .catch(() => {
          busy.current = false;
          apply();
        });
    };
    return () => {
      controller = null;
    };
  }, [target, opacity]);

  function onSnapshotShown() {
    const apply = pendingApply.current;
    pendingApply.current = null;
    if (!apply) return;
    apply();
    // Give the new theme one frame to render under the snapshot, then fade.
    requestAnimationFrame(() =>
      fadeOut(() => {
        setSnapshot(null);
        busy.current = false;
      }),
    );
  }

  // Phone-driven changes (System mode): fade from the old background, decided before paint.
  useLayoutEffect(() => {
    const prev = previous.current;
    previous.current = { isDark, background: colors.background };
    if (prev.isDark === isDark || busy.current || reduceMotionNow()) return;
    opacity.setValue(1);
    setCover(prev.background);
    fadeOut(() => setCover(null));
  }, [isDark, colors.background]); // eslint-disable-line react-hooks/exhaustive-deps

  if (snapshot) {
    return (
      <Animated.Image
        source={{ uri: snapshot }}
        onLoad={onSnapshotShown}
        onError={onSnapshotShown}
        fadeDuration={0}
        resizeMode="stretch"
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { opacity }]}
      />
    );
  }
  if (cover) return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: cover, opacity }]} />;
  return null;
}
