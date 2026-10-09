import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { usePantry } from '@/features/pantry/pantry-provider';
import { useSettings } from '@/features/settings/settings-provider';
import { useShopping } from '@/features/shopping/shopping-provider';
import { useWorkout } from '@/features/workout/workout-provider';

import { syncNotifications } from './notifications';
import { buildSchedule } from './schedule';

/**
 * Keeps the scheduled local notifications in line with the app's data. Renders nothing.
 * Re-syncs whenever pantry, shopping list, workout plan or notification settings change,
 * and again when the app returns to the foreground (so dates that rolled over are refreshed).
 */
export function NotificationSync() {
  const { settings } = useSettings();
  const { items, loaded: pantryLoaded } = usePantry();
  const { entries } = useShopping();
  const { profile, week, history, todayISO, loaded: workoutLoaded } = useWorkout();
  const [foreground, setForeground] = useState(0);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setForeground((n) => n + 1);
    });
    return () => sub.remove();
  }, []);

  const ready = pantryLoaded && workoutLoaded;

  const list = useMemo(() => {
    if (!ready) return null;
    return buildSchedule({
      now: new Date(),
      prefs: settings.notifications,
      pantry: items,
      shopping: entries,
      profile,
      week,
      completedDates: history.map((h) => h.date),
    });
    // todayISO and foreground make the schedule refresh after midnight / when reopening the app.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, settings.notifications, items, entries, profile, week, history, todayISO, foreground]);

  useEffect(() => {
    if (list) syncNotifications(list);
  }, [list]);

  return null;
}
