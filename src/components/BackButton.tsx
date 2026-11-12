import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Animated, Pressable } from 'react-native';
import { useTheme } from '@/theme';
import { usePressScale } from './usePressScale';

/** Header back arrow without the Android ripple circle: a plain chevron that shrinks when pressed. */
export function BackButton() {
  const { colors } = useTheme();
  const press = usePressScale(0.85);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      onPress={() => router.back()}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      hitSlop={8}
      style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginLeft: -12 }}
    >
      <Animated.View style={press.style}>
        <Ionicons name="chevron-back" size={26} color={colors.text} />
      </Animated.View>
    </Pressable>
  );
}
