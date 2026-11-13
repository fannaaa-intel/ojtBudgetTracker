import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Animated, Easing, ScrollView, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { AnimatedAmount, Appear, AppText, BarChart, Chip, ChipRow, IconBadge, ProgressBar, useReduceMotion, type IconName } from '@/components';
import { useMealPresets } from '@/features/meals/queries';
import { useTheme } from '@/theme';

/* ───────────────────────── Pulse rings behind the logo ───────────────────────── */

/** Two thin rings that slowly ripple out from the logo. Ambient, greys only, off with Reduce Motion. */
export function PulseRings({ size }: { size: number }) {
  const { colors } = useTheme();
  const reduce = useReduceMotion();
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduce) return;
    const ripple = (v: Animated.Value) => Animated.loop(Animated.timing(v, { toValue: 1, duration: 2600, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    const first = ripple(a);
    const second = Animated.sequence([Animated.delay(1300), ripple(b)]);
    first.start();
    second.start();
    return () => {
      first.stop();
      second.stop();
    };
  }, [reduce, a, b]);

  if (reduce) return null;
  return (
    <>
      {[a, b].map((v, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 1,
            borderColor: colors.textMuted,
            opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
            transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.9, 2] }) }],
          }}
        />
      ))}
    </>
  );
}

/* ───────────────────────── Live preview of the app ───────────────────────── */

const TAP_EVERY_MS = 1700;
/** Relative heights only (no pesos shown) — the bar chart is a picture of a week, not data. */
const WEEK_SHAPE = [6, 9, 5, 8, 12, 4, 3];
const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/**
 * A small mock of the app that "uses itself": meal chips get tapped one after another and the
 * Today amount counts up. Prices come from the seeded meal presets (never hardcoded).
 */
export function WelcomePreview() {
  const { colors, radius, spacing } = useTheme();
  const reduce = useReduceMotion();
  const presets = useMealPresets('NCR')
    .filter((p) => p.price > 0)
    .slice(0, 3);
  const [step, setStep] = useState(reduce ? 2 : 0);

  useEffect(() => {
    if (reduce || presets.length === 0) {
      setStep(Math.min(2, presets.length));
      return;
    }
    // 0 → 1 → 2 → 3 taps, hold, then start the day again.
    const t = setInterval(() => setStep((s) => (s >= presets.length + 1 ? 0 : s + 1)), TAP_EVERY_MS);
    return () => clearInterval(t);
  }, [reduce, presets.length]);

  const tapped = Math.min(step, presets.length);
  const total = presets.slice(0, tapped).reduce((s, p) => s + p.price, 0);
  const points = WEEK_SHAPE.map((v, i) => ({ key: String(i), label: WEEK_DAYS[i], amount: v }));

  return (
    <View
      accessible
      accessibilityLabel="Preview: tap a meal once and it is logged; today's total, OJT hours and your week update by themselves."
      pointerEvents="none"
      style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.lg + 4, padding: spacing.md, gap: spacing.md }}
    >
      {/* Fake status bar: three dots + label, so it reads as "a phone screen". */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xs }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.border }} />
          ))}
        </View>
        <AppText variant="label" tone="muted">
          Sample day
        </AppText>
      </View>

      {/* Today hero, exactly like the Home card. */}
      <View style={{ backgroundColor: colors.inverse, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <AppText variant="label" tone="inverse">
            Today
          </AppText>
          <Ionicons name="sunny-outline" size={16} color={colors.onInverse} />
        </View>
        <AnimatedAmount value={total} variant="amountLarge" tone="inverse" />
        <AppText variant="caption" tone="inverse" style={{ opacity: 0.75 }}>
          {tapped === 0 ? 'Tap a meal to log it' : `${tapped} ${tapped === 1 ? 'meal' : 'meals'} logged, one tap each`}
        </AppText>
      </View>

      {/* Meal chips being "tapped". */}
      {presets.length > 0 ? (
        <ChipRow>
          {presets.map((p, i) => (
            <Chip key={p.id} label={p.label} selected={i < tapped} />
          ))}
        </ChipRow>
      ) : null}

      {/* OJT hours + this week, side by side. */}
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1, backgroundColor: colors.background, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <AppText variant="label" tone="muted">
              OJT hours
            </AppText>
          </View>
          <AnimatedAmount value={62} format={(n) => `${n}%`} delay={400} />
          <ProgressBar pct={62} delay={400} />
        </View>
        <View style={{ flex: 1, backgroundColor: colors.background, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Ionicons name="bar-chart-outline" size={14} color={colors.textSecondary} />
            <AppText variant="label" tone="muted">
              Week
            </AppText>
          </View>
          <BarChart points={points} height={44} accessibilityLabel="A week of spending" />
        </View>
      </View>
    </View>
  );
}

/* ───────────────────────── Swipeable feature slides ───────────────────────── */

const SLIDES: { icon: IconName; title: string; body: string }[] = [
  { icon: 'bus-outline', title: 'Pamasahe in one tap', body: 'Save your route once. Log the round trip with the right fare and your student discount.' },
  { icon: 'restaurant-outline', title: 'Pagkain and budgets', body: 'Meal presets, weekly envelopes, and how much is safe to spend today.' },
  { icon: 'time-outline', title: 'OJT hours and total cost', body: 'Log your hours, see your end date, and what your OJT really costs.' },
  { icon: 'lock-closed-outline', title: 'Private and offline', body: 'Everything stays on your phone. No account, no internet.' },
];
const AUTO_MS = 4000;
const PAUSE_AFTER_TOUCH_MS = 8000;

/** Paging cards with animated page dots. Advance by themselves (paused after a swipe; off with Reduce Motion). */
export function FeatureSlides() {
  const { colors, radius, spacing } = useTheme();
  const reduce = useReduceMotion();
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const ref = useRef<ComponentRef<typeof ScrollView>>(null);
  const pausedUntil = useRef(0);
  const pageRef = useRef(0);
  pageRef.current = page;

  useEffect(() => {
    if (reduce || width === 0) return;
    const t = setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      const next = (pageRef.current + 1) % SLIDES.length;
      ref.current?.scrollTo({ x: next * width, animated: true });
      setPage(next);
    }, AUTO_MS);
    return () => clearInterval(t);
  }, [reduce, width]);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w !== width) setWidth(w);
  };
  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width > 0) setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={{ gap: spacing.md }} onLayout={onLayout}>
      {width > 0 ? (
        <Animated.ScrollView
          ref={ref}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          overScrollMode="never"
          onScrollBeginDrag={() => (pausedUntil.current = Date.now() + PAUSE_AFTER_TOUCH_MS)}
          onMomentumScrollEnd={onEnd}
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
        >
          {SLIDES.map((s, i) => (
            <View key={s.title} style={{ width }} accessible accessibilityLabel={`${s.title}. ${s.body}. ${i + 1} of ${SLIDES.length}`}>
              <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.md, minHeight: 188 }}>
                <IconBadge name={s.icon} size={56} inverse={i === page} />
                <AppText variant="heading">{s.title}</AppText>
                <AppText tone="secondary">{s.body}</AppText>
              </View>
            </View>
          ))}
        </Animated.ScrollView>
      ) : (
        <View style={{ minHeight: 188 }} />
      )}

      {/* Page dots: the current one grows and darkens as you swipe. */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.sm }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {SLIDES.map((s, i) => {
          const range = [(i - 1) * width, i * width, (i + 1) * width];
          return (
            <Animated.View
              key={s.title}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.inverse,
                opacity: width ? scrollX.interpolate({ inputRange: range, outputRange: [0.2, 1, 0.2], extrapolate: 'clamp' }) : i === 0 ? 1 : 0.2,
                transform: [{ scale: width ? scrollX.interpolate({ inputRange: range, outputRange: [0.8, 1.3, 0.8], extrapolate: 'clamp' }) : 1 }],
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

/* ───────────────────────── Trust pills ───────────────────────── */

const PILLS: { icon: IconName; label: string }[] = [
  { icon: 'cloud-offline-outline', label: 'Offline' },
  { icon: 'person-outline', label: 'No account' },
  { icon: 'pricetag-outline', label: 'Free' },
];

/** Three small outlined promises, popping in one after another. */
export function TrustPills({ delay = 0 }: { delay?: number }) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm }}>
      {PILLS.map((p, i) => (
        <Appear key={p.label} index={i} delay={delay} grow>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name={p.icon} size={14} color={colors.text} />
            <AppText variant="caption">{p.label}</AppText>
          </View>
        </Appear>
      ))}
    </View>
  );
}
