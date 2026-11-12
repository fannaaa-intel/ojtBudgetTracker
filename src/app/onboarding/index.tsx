import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, View } from 'react-native';
import { AppText, Button, Logo, Screen } from '@/components';
import { useTheme } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  { icon: 'bus-outline', title: 'Pamasahe in one tap', body: 'Save your route once. Log the round trip with the right fare, student discount included.' },
  { icon: 'restaurant-outline', title: 'Pagkain and budgets', body: 'Meal presets, weekly envelopes and how much is safe to spend today.' },
  { icon: 'time-outline', title: 'OJT hours and total cost', body: 'Log your hours, see your end date and what your OJT really costs.' },
  { icon: 'lock-closed-outline', title: 'Private and offline', body: 'Everything stays on your phone. No account, no internet.' },
];

function Feature({ icon, title, body }: (typeof FEATURES)[number]) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
      <View style={{ width: 40, height: 40, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={20} color={colors.text} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="heading">{title}</AppText>
        <AppText variant="caption" tone="secondary">
          {body}
        </AppText>
      </View>
    </View>
  );
}

/** Welcome: logo, promise, four reasons, one primary action. Fades in unless Reduce Motion is on. */
export default function Welcome() {
  const { colors, spacing } = useTheme();
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled) return;
        if (reduce) fade.setValue(1);
        else Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }).start();
      });
    return () => {
      cancelled = true;
    };
  }, [fade]);

  const rise = fade.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });

  return (
    <Screen
      footer={
        <View style={{ gap: spacing.sm }}>
          <Button label="Get started" onPress={() => router.push('/onboarding/register')} />
          <AppText variant="caption" tone="muted" style={{ textAlign: 'center' }}>
            About a minute · 4 quick steps · for OJT interns
          </AppText>
        </View>
      }
    >
      <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }], gap: spacing.xl, paddingTop: spacing.xl }}>
        <View style={{ gap: spacing.md }}>
          <Logo size={64} />
          <AppText variant="label" tone="muted">
            OJT Budget
          </AppText>
          <AppText variant="display">Track every peso of your OJT.</AppText>
          <AppText tone="secondary">Pamasahe, pagkain, bills and gala — on your phone, even without signal.</AppText>
        </View>

        <View style={{ height: 1, backgroundColor: colors.border }} />

        <View style={{ gap: spacing.lg }}>
          {FEATURES.map((f) => (
            <Feature key={f.title} {...f} />
          ))}
        </View>
      </Animated.View>
    </Screen>
  );
}
