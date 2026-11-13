import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';
import { MOTION, staggerDelay } from '@/lib/motion';
import { reduceMotionNow } from './useReduceMotion';

type Props = {
  children: ReactNode;
  /** Position in a list: items appear one after another (only the first few are delayed). */
  index?: number;
  /** Extra delay before this group starts (ms). */
  delay?: number;
  /** How far the content rises while fading in (px). 0 = fade only. */
  rise?: number;
  /** Start slightly smaller and grow to full size (hero cards). */
  grow?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Fades and rises its content in once, when it first mounts — never again on data refreshes,
 * so live lists stay calm. Native driver; skipped entirely when Reduce Motion is on.
 */
export function Appear({ children, index = 0, delay = 0, rise = MOTION.rise, grow, style }: Props) {
  const reduce = reduceMotionNow();
  const v = useRef(new Animated.Value(reduce ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotionNow()) {
      v.setValue(1);
      return;
    }
    const anim = Animated.timing(v, {
      toValue: 1,
      duration: MOTION.enterMs,
      delay: staggerDelay(index, delay),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- mount only, on purpose

  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [rise, 0] });
  const scale = grow ? v.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) : 1;

  return <Animated.View style={[style, { opacity: v, transform: [{ translateY }, { scale }] }]}>{children}</Animated.View>;
}
