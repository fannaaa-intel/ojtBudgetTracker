import { useRef } from 'react';
import { Animated } from 'react-native';

/**
 * Minimal press feedback instead of Android's ripple: the element shrinks a little while
 * pressed and springs back on release. Native driver, so it stays smooth.
 */
export function usePressScale(pressedScale = 0.92) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (value: number) => Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  return {
    style: { transform: [{ scale }] },
    onPressIn: () => to(pressedScale),
    onPressOut: () => to(1),
  };
}
