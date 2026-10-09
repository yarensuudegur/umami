import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const KEY = 'umami.settings.v1';

export type Settings = { dailyProteinGoal: number };
export const DEFAULT_SETTINGS: Settings = { dailyProteinGoal: 120 };

type SettingsContextValue = {
  settings: Settings;
  setDailyProteinGoal: (grams: number) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const goal = Number(parsed?.dailyProteinGoal);
    return { ...DEFAULT_SETTINGS, ...(Number.isFinite(goal) && goal > 0 ? { dailyProteinGoal: goal } : {}) };
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
    AsyncStorage.setItem(KEY, JSON.stringify(settings)).catch(() => {});
  }, [settings, loaded]);

  const setDailyProteinGoal = useCallback((grams: number) => {
    setSettings((prev) => ({ ...prev, dailyProteinGoal: grams }));
  }, []);

  const value = useMemo(() => ({ settings, setDailyProteinGoal }), [settings, setDailyProteinGoal]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}
