import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { DEFAULT_SETTINGS, parseSettings, SETTINGS_KEY, type NotificationPrefs, type Settings } from './settings-model';

type SettingsContextValue = {
  settings: Settings;
  setDailyProteinGoal: (grams: number) => void;
  updateNotifications: (patch: Partial<NotificationPrefs>) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return parseSettings(raw ? JSON.parse(raw) : null);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadSettings().then((s) => {
      setSettings(s);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)).catch(() => {});
  }, [settings, loaded]);

  const setDailyProteinGoal = useCallback((grams: number) => {
    setSettings((prev) => ({ ...prev, dailyProteinGoal: grams }));
  }, []);

  const updateNotifications = useCallback((patch: Partial<NotificationPrefs>) => {
    setSettings((prev) => ({ ...prev, notifications: { ...prev.notifications, ...patch } }));
  }, []);

  const value = useMemo(
    () => ({ settings, setDailyProteinGoal, updateNotifications }),
    [settings, setDailyProteinGoal, updateNotifications],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}
