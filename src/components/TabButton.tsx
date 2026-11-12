import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Animated, Pressable, View, type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { usePressScale } from './usePressScale';

type Props = {
  children: ReactNode;
  onPress?: (e: GestureResponderEvent) => void;
  onLongPress?: ((e: GestureResponderEvent) => void) | null;
  style?: StyleProp<ViewStyle>;
  accessibilityState?: { selected?: boolean };
  accessibilityLabel?: string;
  testID?: string;
  /** Short underline under the active tab. Off for the + button (it is always filled). */
  showIndicator?: boolean;
};

/**
 * Bottom-tab button without Android's ripple. Feedback: a light haptic tick, a small
 * press-shrink, and a short underline under the active tab.
 */
export function TabButton({ children, onPress, onLongPress, style, accessibilityState, accessibilityLabel, testID, showIndicator = true }: Props) {
  const { colors, radius } = useTheme();
  const press = usePressScale(0.9);
  const selected = !!accessibilityState?.selected;

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={(e) => {
        Haptics.selectionAsync().catch(() => {});
        onPress?.(e);
      }}
      onLongPress={onLongPress ?? undefined}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[style, { alignItems: 'center', justifyContent: 'center' }]}
    >
      <Animated.View style={[{ flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' }, press.style]}>{children}</Animated.View>
      {showIndicator ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: 2,
            width: 18,
            height: 2,
            borderRadius: radius.pill,
            backgroundColor: selected ? colors.inverse : 'transparent',
          }}
        />
      ) : null}
    </Pressable>
  );
}
