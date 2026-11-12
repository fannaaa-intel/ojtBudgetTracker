import { useTheme } from '@/theme';

/** Shared header look for stack screens (back arrow, no title, no shadow, themed). */
export function useStackOptions() {
  const { colors } = useTheme();
  return {
    title: '',
    headerShadowVisible: false,
    headerTintColor: colors.text,
    headerStyle: { backgroundColor: colors.background },
    contentStyle: { backgroundColor: colors.background },
  } as const;
}
