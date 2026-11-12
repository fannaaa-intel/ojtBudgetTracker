import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { View, type ColorValue } from 'react-native';
import { TabButton } from '@/components/TabButton';
import { useTheme } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

export default function TabsLayout() {
  const { colors, radius } = useTheme();
  const icon =
    (name: IconName, outline: IconName) =>
    ({ focused, color, size }: { focused: boolean; color: ColorValue | null; size: number }) => (
      <Ionicons name={focused ? name : outline} color={typeof color === 'string' ? color : colors.text} size={size} />
    );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border, borderTopWidth: 1, elevation: 0 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        // No Android ripple: custom button with haptic tick, press-shrink and active underline.
        tabBarButton: (props) => <TabButton {...props} />,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home', 'home-outline') }} />
      <Tabs.Screen name="commute" options={{ title: 'Commute', tabBarIcon: icon('bus', 'bus-outline') }} />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add',
          tabBarAccessibilityLabel: 'Add an expense or income',
          // The one strong element in the bar: a soft-cornered inverse square with a thin plus.
          tabBarIcon: () => (
            <View
              style={{
                width: 52,
                height: 36,
                borderRadius: radius.md,
                backgroundColor: colors.inverse,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="add" size={24} color={colors.onInverse} />
            </View>
          ),
          tabBarLabel: () => null,
          tabBarButton: (props) => <TabButton {...props} showIndicator={false} />,
        }}
      />
      <Tabs.Screen name="budget" options={{ title: 'Budget', tabBarIcon: icon('pie-chart', 'pie-chart-outline') }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: icon('ellipsis-horizontal-circle', 'ellipsis-horizontal-circle-outline') }} />
    </Tabs>
  );
}
