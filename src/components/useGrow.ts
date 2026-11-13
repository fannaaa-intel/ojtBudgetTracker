import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { MOTION } from '@/lib/motion';
import { reduceMotionNow } from './useReduceMotion';

/**
 * An Animated value (0–1) that eases to `target` — from 0 on mount, then from wherever it is.
 * Used as scaleX / scaleY on bars so they grow on the native driver (no width animation).
 */
export function useGrow(target: number, delay = 0) {
  const v = useRef(new Animated.Value(reduceMotionNow() ? target : 0)).current;
  useEffect(() => {
    if (reduceMotionNow()) {
      v.setValue(target);
      return;
    }
    const anim = Animated.timing(v, { toValue: target, duration: MOTION.barMs, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [target, delay, v]);
  return v;
}
