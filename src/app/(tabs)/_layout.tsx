import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { View, type ColorValue } from 'react-native';
import { useTheme } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

export default function TabsLayout() {
  const { colors } = useTheme();
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
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home', 'home-outline') }} />
      <Tabs.Screen name="commute" options={{ title: 'Commute', tabBarIcon: icon('bus', 'bus-outline') }} />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add',
          // The one strong element in the bar: an inverse circle (black on light, white on dark).
          tabBarIcon: () => (
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.inverse, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="add" size={26} color={colors.onInverse} />
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen name="budget" options={{ title: 'Budget', tabBarIcon: icon('pie-chart', 'pie-chart-outline') }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: icon('ellipsis-horizontal-circle', 'ellipsis-horizontal-circle-outline') }} />
    </Tabs>
  );
}
