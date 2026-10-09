import Ionicons from '@expo/vector-icons/Ionicons';
import { DarkTheme, DefaultTheme, ThemeProvider, Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { NotificationSync } from '@/features/notifications/notification-sync';
import { PantryProvider } from '@/features/pantry/pantry-provider';
import { DataRoot } from '@/features/settings/data-root';
import { SettingsProvider } from '@/features/settings/settings-provider';
import { ShoppingProvider } from '@/features/shopping/shopping-provider';
import { WorkoutProvider } from '@/features/workout/workout-provider';

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
      <DataRoot>
      <SettingsProvider>
        <ShoppingProvider>
        <WorkoutProvider>
        <PantryProvider>
          <StatusBar style="auto" />
          <NotificationSync />
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: colors.accent,
              tabBarInactiveTintColor: colors.textSecondary,
              tabBarStyle: {
                backgroundColor: colors.backgroundElement,
                borderTopColor: colors.border,
                // The default web tab bar is too short for icon + label and clips the labels.
                ...(Platform.OS === 'web' ? { height: 68, paddingTop: 6, paddingBottom: 10 } : null),
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
        </WorkoutProvider>
        </ShoppingProvider>
      </SettingsProvider>
      </DataRoot>
    </ThemeProvider>
  );
}
