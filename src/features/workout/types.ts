export type Level = 'beginner' | 'intermediate' | 'advanced';
export const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced'];

export type Group = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'legs' | 'core';

export type Exercise = {
  /** free-exercise-db id; also the image file name. */
  id: string;
  name: string;
  group: Group;
  minLevel: Level;
  /** "time" exercises are held for seconds (plank) instead of counted in reps. */
  kind: 'reps' | 'time';
  description: string;
};

export type FocusId =
  | 'full'
  | 'upper'
  | 'lower'
  | 'push'
  | 'pull'
  | 'legs'
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'core';

export type Profile = { daysPerWeek: number; level: Level };

export type PlannedExercise = {
  id: string;
  sets: number;
  /** e.g. "10–12"; for time exercises this is empty and `seconds` is used. */
  reps?: string;
  seconds?: number;
};

export type DayPlan = {
  /** null = rest day. */
  focus: FocusId | null;
  exercises: PlannedExercise[];
};

export type Week = {
  /** ISO date (yyyy-mm-dd) of the Monday of this week. */
  weekStart: string;
  days: DayPlan[];
  /** Shown above the week, e.g. when a rebalance had to shorten the week. */
  note?: string;
};

export type HistoryEntry = {
  id: string;
  /** ISO date of the workout. */
  date: string;
  focus: FocusId;
  exercises: { id: string; name: string; done: boolean }[];
};

export type WorkoutState = {
  profile: Profile | null;
  week: Week | null;
  /** Exercise ids ticked off per ISO date, for workouts that are not finished yet. */
  progress: Record<string, string[]>;
  history: HistoryEntry[];
};
