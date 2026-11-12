import { createElement } from 'react';
import { useTheme } from '@/theme';
import { BackButton } from './BackButton';

/** Shared header look for stack screens: custom back chevron (no ripple), no title, no shadow, themed. */
export function useStackOptions() {
  const { colors } = useTheme();
  return {
    title: '',
    headerShadowVisible: false,
    headerTintColor: colors.text,
    headerStyle: { backgroundColor: colors.background },
    contentStyle: { backgroundColor: colors.background },
    headerBackVisible: false,
    headerLeft: ({ canGoBack }: { canGoBack?: boolean }) => (canGoBack ? createElement(BackButton) : null),
  } as const;
}
