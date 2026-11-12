import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

type Props = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  scroll?: boolean;
  footer?: ReactNode;
  /** false when a navigation header already covers the top inset (onboarding steps). */
  insetTop?: boolean;
};

/** Page wrapper: safe area, background, optional large title and a pinned footer (e.g. Continue button). */
export function Screen({ title, subtitle, children, scroll = true, footer, insetTop = true }: Props) {
  const { colors, spacing } = useTheme();
  const body = (
    <View style={{ padding: spacing.lg, gap: spacing.lg }}>
      {title ? (
        <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
          <AppText variant="title">{title}</AppText>
          {subtitle ? <AppText tone="secondary">{subtitle}</AppText> : null}
        </View>
      ) : null}
      {children}
    </View>
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={[...(insetTop ? (['top'] as const) : []), 'left', 'right', ...(footer ? (['bottom'] as const) : [])]}>
      {scroll ? <ScrollView keyboardShouldPersistTaps="handled">{body}</ScrollView> : <View style={{ flex: 1 }}>{body}</View>}
      {footer ? <View style={{ padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border }}>{footer}</View> : null}
    </SafeAreaView>
  );
}
