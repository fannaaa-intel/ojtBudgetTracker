import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * The phone's Reduce Motion setting, shared by every animation. Cached at module level so a
 * component can decide synchronously on its first frame (no flash of the animated start state).
 */
let cached = false;
const listeners = new Set<(v: boolean) => void>();

AccessibilityInfo.isReduceMotionEnabled?.()
  .then((v) => set(v))
  .catch(() => {});
AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v) => set(v));

function set(v: boolean) {
  cached = v;
  listeners.forEach((l) => l(v));
}

/** Synchronous read for animation start code (effects, callbacks). */
export function reduceMotionNow(): boolean {
  return cached;
}

/** Re-renders when the setting changes. */
export function useReduceMotion(): boolean {
  const [v, setV] = useState(cached);
  useEffect(() => {
    listeners.add(setV);
    setV(cached);
    return () => {
      listeners.delete(setV);
    };
  }, []);
  return v;
}
