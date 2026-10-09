import Ionicons from '@expo/vector-icons/Ionicons';
import { DarkTheme, DefaultTheme, ThemeProvider, Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { PantryProvider } from '@/features/pantry/pantry-provider';
import { SettingsProvider } from '@/features/settings/settings-provider';
import { ShoppingProvider } from '@/features/shopping/shopping-provider';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { name: string; title: string; icon: IconName; iconActive: IconName }[] = [
  { name: 'index', title: 'Today', icon: 'sunny-outline', iconActive: 'sunny' },
  { name: 'pantry', title: 'Pantry', icon: 'basket-outline', iconActive: 'basket' },
  { name: 'recipes', title: 'Recipes', icon: 'book-outline', iconActive: 'book' },
  { name: 'shopping', title: 'Shopping', icon: 'cart-outline', iconActive: 'cart' },
  { name: 'workout', title: 'Workout', icon: 'barbell-outline', iconActive: 'barbell' },
];

export default function RootLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = Colors[scheme];

  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SettingsProvider>
        <ShoppingProvider>
        <PantryProvider>
          <StatusBar style="auto" />
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: colors.accent,
              tabBarInactiveTintColor: colors.textSecondary,
              tabBarStyle: {
                backgroundColor: colors.backgroundElement,
                borderTopColor: colors.border,
              },
              tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
            }}>
            {TABS.map((tab) => (
              <Tabs.Screen
                key={tab.name}
                name={tab.name}
                options={{
                  title: tab.title,
                  tabBarIcon: ({ color, size, focused }) => (
                    <Ionicons name={focused ? tab.iconActive : tab.icon} size={size} color={color} />
                  ),
                }}
              />
            ))}
          </Tabs>
        </PantryProvider>
        </ShoppingProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
