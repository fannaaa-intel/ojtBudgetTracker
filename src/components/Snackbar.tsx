import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSnackbar } from '@/store/snackbar';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

const VISIBLE_MS = 5000;
/** Keeps the bar above the tab bar / pinned footer buttons. */
const BOTTOM_OFFSET = 72;

/** Mounted once in the root layout. Inverse bar with an optional action (Undo). */
export function Snackbar() {
  const { colors, radius, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const snack = useSnackbar((s) => s.snack);
  const hide = useSnackbar((s) => s.hide);

  useEffect(() => {
    if (!snack) return;
    const t = setTimeout(() => hide(snack.id), VISIBLE_MS);
    return () => clearTimeout(t);
  }, [snack, hide]);

  if (!snack) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: insets.bottom + BOTTOM_OFFSET }}
    >
      <View
        accessibilityLiveRegion="polite"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          minHeight: 48,
          paddingLeft: spacing.lg,
          paddingRight: spacing.xs,
          borderRadius: radius.md,
          backgroundColor: colors.inverse,
        }}
      >
        <AppText tone="inverse" style={{ flex: 1, paddingVertical: spacing.sm }}>
          {snack.message}
        </AppText>
        {snack.actionLabel ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              snack.onAction?.();
              hide(snack.id);
            }}
            style={({ pressed }) => ({ minHeight: 48, minWidth: 64, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md, opacity: pressed ? 0.6 : 1 })}
          >
            <AppText variant="label" tone="inverse" style={{ textDecorationLine: 'underline' }}>
              {snack.actionLabel}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
