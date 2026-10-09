import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** Returns a number that changes every time the app returns to the foreground, to refresh "today"-based values. */
export function useForegroundTick(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setTick((n) => n + 1);
    });
    return () => sub.remove();
  }, []);
  return tick;
}
