import AsyncStorage from '@react-native-async-storage/async-storage';

import type { WorkoutState } from './types';

const KEY = 'umami.workout.v1';

export const EMPTY_WORKOUT_STATE: WorkoutState = { profile: null, week: null, progress: {}, history: [] };

export async function loadWorkout(): Promise<WorkoutState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== 'object') return EMPTY_WORKOUT_STATE;
    return {
      profile: parsed.profile ?? null,
      week: parsed.week ?? null,
      progress: parsed.progress ?? {},
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch {
    return EMPTY_WORKOUT_STATE;
  }
}

export async function saveWorkout(state: WorkoutState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage failures are non-fatal; state stays in memory.
  }
}
