import { useEffect, useRef, useState } from 'react';
import type { TextProps } from 'react-native';
import { countUpValue, MOTION } from '@/lib/motion';
import { formatPeso } from '@/lib/money';
import type { TypographyVariant } from '@/theme';
import { AppText } from './AppText';
import { reduceMotionNow } from './useReduceMotion';

type Props = Omit<TextProps, 'children'> & {
  /** Centavos by default; any number when `format` and `integer={false}` are given. */
  value: number;
  format?: (n: number) => string;
  /** Keep every frame a whole number (money in centavos). */
  integer?: boolean;
  /** Count up from 0 the first time it appears. */
  fromZero?: boolean;
  delay?: number;
  variant?: TypographyVariant;
  tone?: 'default' | 'secondary' | 'muted' | 'inverse';
};

/**
 * A number that counts to its new value (≤ 300 ms, ease-out) instead of jumping.
 * Screen readers only ever hear the final value. Instant when Reduce Motion is on.
 */
export function AnimatedAmount({ value, format = formatPeso, integer = true, fromZero = true, delay = 0, variant = 'amount', ...rest }: Props) {
  const [shown, setShown] = useState(() => (fromZero && !reduceMotionNow() ? 0 : value));
  const shownRef = useRef(shown);
  shownRef.current = shown;

  useEffect(() => {
    const from = shownRef.current;
    if (from === value) return;
    if (reduceMotionNow()) {
      setShown(value);
      return;
    }
    let frame = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const t = (now - start - delay) / MOTION.countMs;
      if (t < 0) {
        frame = requestAnimationFrame(tick);
        return;
      }
      setShown(countUpValue(from, value, t, integer));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, integer, delay]);

  return (
    <AppText variant={variant} accessibilityLabel={format(value)} {...rest}>
      {format(shown)}
    </AppText>
  );
}
