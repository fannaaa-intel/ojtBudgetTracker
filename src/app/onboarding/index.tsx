import { router } from 'expo-router';
import { View } from 'react-native';
import { Appear, AppText, Button, Logo, Screen } from '@/components';
import { FeatureSlides, PulseRings, TrustPills, WelcomePreview } from '@/features/onboarding/components/WelcomeShowcase';
import { useTheme } from '@/theme';

const LOGO = 72;

/**
 * Welcome / Get started — a small showcase: hero with rippling logo, a live preview of the app
 * using itself, swipeable feature cards, three promises and one primary action.
 * Everything animates in once; ambient motion stops when Reduce Motion is on.
 */
export default function Welcome() {
  const { colors, radius, spacing } = useTheme();

  return (
    <Screen
      footer={
        <Appear delay={600} rise={0}>
          <View style={{ gap: spacing.sm }}>
            <Button label="Get started" onPress={() => router.push('/onboarding/register')} />
            <AppText variant="caption" tone="muted" style={{ textAlign: 'center' }}>
              About a minute. 4 quick steps.
            </AppText>
          </View>
        </Appear>
      }
    >
      {/* Hero */}
      <View style={{ alignItems: 'center', gap: spacing.lg, paddingTop: spacing.xl }}>
        <Appear grow>
          <View style={{ width: LOGO + 48, height: LOGO + 48, alignItems: 'center', justifyContent: 'center' }}>
            <PulseRings size={LOGO + 16} />
            <Logo size={LOGO} />
          </View>
        </Appear>
        <Appear index={1}>
          <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs }}>
            <AppText variant="label" tone="secondary">
              For OJT interns
            </AppText>
          </View>
        </Appear>
        <Appear index={2}>
          <AppText variant="display" style={{ textAlign: 'center' }}>
            Track every peso of your OJT.
          </AppText>
        </Appear>
        <Appear index={3}>
          <AppText tone="secondary" style={{ textAlign: 'center', paddingHorizontal: spacing.md }}>
            Pamasahe, pagkain, bills and gala — on your phone, even without signal.
          </AppText>
        </Appear>
      </View>

      {/* Live preview */}
      <Appear delay={260} grow style={{ gap: spacing.md }}>
        <AppText variant="label" tone="muted" style={{ textAlign: 'center' }}>
          See it in action
        </AppText>
        <WelcomePreview />
      </Appear>

      {/* What you get */}
      <Appear delay={420} style={{ gap: spacing.md }}>
        <AppText variant="label" tone="muted" style={{ textAlign: 'center' }}>
          What you get
        </AppText>
        <FeatureSlides />
      </Appear>

      <TrustPills delay={520} />
    </Screen>
  );
}
