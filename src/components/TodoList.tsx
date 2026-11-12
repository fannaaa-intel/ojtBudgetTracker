import { View } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

/** Placeholder used by tab screens until their phase is built. Remove when the screen is done. */
export function TodoList({ phase, items }: { phase: string; items: string[] }) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View style={{ borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm }}>
      <AppText variant="label" tone="muted">{phase} — to build</AppText>
      {items.map((item) => (
        <AppText key={item} tone="secondary">
          ○ {item}
        </AppText>
      ))}
    </View>
  );
}
