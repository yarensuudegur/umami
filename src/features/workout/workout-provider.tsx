import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { getExercise } from './exercises';
import { buildWeek, dateOfDay, dayIndexOf, rebalance, weekStartOf } from './plan';
import { EMPTY_WORKOUT_STATE, loadWorkout, saveWorkout } from './storage';
import type { FocusId, HistoryEntry, Profile, Week, WorkoutState } from './types';

type WorkoutContextValue = {
  loaded: boolean;
  profile: Profile | null;
  /** The plan for the current calendar week (a stale stored week is replaced automatically). */
  week: Week | null;
  history: HistoryEntry[];
  /** Exercise ids ticked off for unfinished workouts, by ISO date. */
  progress: Record<string, string[]>;
  todayIndex: number;
  todayISO: string;
  /** Day indexes (Mon = 0) of this week that already have a finished workout. */
  completedDays: number[];
  savePlan: (profile: Profile) => void;
  toggleExercise: (date: string, exerciseId: string) => void;
  finishWorkout: (date: string) => void;
  trainToday: (focus: FocusId) => void;
};

const WorkoutContext = createContext<WorkoutContextValue | null>(null);
const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WorkoutState>(EMPTY_WORKOUT_STATE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadWorkout().then((stored) => {
      setState(stored);
      setLoaded(true);
    });
  }, []);

  // Only persist after the initial load so we never overwrite stored data.
  useEffect(() => {
    if (loaded) saveWorkout(state);
  }, [state, loaded]);

  const now = new Date();
  const currentWeekStart = weekStartOf(now);
  const todayIndex = dayIndexOf(now);
  const todayISO = dateOfDay(currentWeekStart, todayIndex);
  const { profile } = state;

  const week = useMemo<Week | null>(() => {
    if (!profile) return null;
    if (state.week && state.week.weekStart === currentWeekStart) return state.week;
    return buildWeek(profile, currentWeekStart);
  }, [profile, state.week, currentWeekStart]);

  const completedDays = useMemo(() => {
    if (!week) return [];
    return week.days.map((_, i) => i).filter((i) => state.history.some((h) => h.date === dateOfDay(week.weekStart, i)));
  }, [week, state.history]);

  const savePlan = useCallback(
    (next: Profile) => {
      setState((prev) => {
        const fresh = buildWeek(next, currentWeekStart);
        // Days before today are history; keep them as they were.
        const kept = prev.week && prev.week.weekStart === currentWeekStart ? prev.week.days : [];
        const days = fresh.days.map((d, i) => (i < todayIndex && kept[i] ? kept[i] : d));
        return { ...prev, profile: next, week: { ...fresh, days } };
      });
    },
    [currentWeekStart, todayIndex],
  );

  const toggleExercise = useCallback((date: string, exerciseId: string) => {
    setState((prev) => {
      const current = prev.progress[date] ?? [];
      const next = current.includes(exerciseId) ? current.filter((id) => id !== exerciseId) : [...current, exerciseId];
      return { ...prev, progress: { ...prev.progress, [date]: next } };
    });
  }, []);

  const finishWorkout = useCallback(
    (date: string) => {
      if (!week) return;
      const index = week.days.findIndex((_, i) => dateOfDay(week.weekStart, i) === date);
      const day = index >= 0 ? week.days[index] : null;
      if (!day?.focus) return;
      const focus = day.focus;
      setState((prev) => {
        const done = new Set(prev.progress[date] ?? []);
        const entry: HistoryEntry = {
          id: newId(),
          date,
          focus,
          exercises: day.exercises.map((ex) => ({ id: ex.id, name: getExercise(ex.id)?.name ?? ex.id, done: done.has(ex.id) })),
        };
        const progress = { ...prev.progress };
        delete progress[date];
        return { ...prev, week, progress, history: [entry, ...prev.history] };
      });
    },
    [week],
  );

  const trainToday = useCallback(
    (focus: FocusId) => {
      if (!week || !profile) return;
      const next = rebalance(week, profile, todayIndex, focus, completedDays);
      setState((prev) => ({ ...prev, week: next, progress: { ...prev.progress, [todayISO]: [] } }));
    },
    [week, profile, todayIndex, completedDays, todayISO],
  );

  const value = useMemo(
    () => ({
      loaded,
      profile,
      week,
      history: state.history,
      progress: state.progress,
      todayIndex,
      todayISO,
      completedDays,
      savePlan,
      toggleExercise,
      finishWorkout,
      trainToday,
    }),
    [loaded, profile, week, state.history, state.progress, todayIndex, todayISO, completedDays, savePlan, toggleExercise, finishWorkout, trainToday],
  );

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}

export function useWorkout(): WorkoutContextValue {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error('useWorkout must be used inside <WorkoutProvider>');
  return ctx;
}
