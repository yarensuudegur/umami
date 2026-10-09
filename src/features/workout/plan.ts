import { toISODate, parseISODate } from '@/features/pantry/status';

import { exercisesFor } from './exercises';
import type { DayPlan, FocusId, Group, Level, PlannedExercise, Profile, Week } from './types';

export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

type Focus = {
  label: string;
  /** Muscle groups this session loads; two sessions that share a group should not be on back-to-back days. */
  groups: Group[];
  /** Which muscle group each exercise slot is drawn from, in priority order. */
  slots: Group[];
};

export const FOCI: Record<FocusId, Focus> = {
  full: { label: 'Full body', groups: ['chest', 'back', 'shoulders', 'legs'], slots: ['legs', 'chest', 'back', 'shoulders', 'legs', 'core', 'back'] },
  upper: { label: 'Upper body', groups: ['chest', 'back', 'shoulders', 'biceps', 'triceps'], slots: ['chest', 'back', 'shoulders', 'back', 'triceps', 'biceps', 'chest'] },
  lower: { label: 'Lower body', groups: ['legs'], slots: ['legs', 'legs', 'legs', 'legs', 'core', 'legs', 'core'] },
  push: { label: 'Push', groups: ['chest', 'shoulders', 'triceps'], slots: ['chest', 'chest', 'shoulders', 'shoulders', 'triceps', 'triceps', 'chest'] },
  pull: { label: 'Pull', groups: ['back', 'biceps'], slots: ['back', 'back', 'back', 'biceps', 'biceps', 'core', 'back'] },
  legs: { label: 'Legs', groups: ['legs'], slots: ['legs', 'legs', 'legs', 'legs', 'core', 'legs', 'core'] },
  chest: { label: 'Chest', groups: ['chest', 'triceps'], slots: ['chest', 'chest', 'chest', 'triceps', 'chest', 'triceps', 'core'] },
  back: { label: 'Back', groups: ['back', 'biceps'], slots: ['back', 'back', 'back', 'biceps', 'back', 'core', 'biceps'] },
  shoulders: { label: 'Shoulders', groups: ['shoulders'], slots: ['shoulders', 'shoulders', 'shoulders', 'back', 'shoulders', 'core', 'shoulders'] },
  arms: { label: 'Arms', groups: ['biceps', 'triceps'], slots: ['biceps', 'triceps', 'biceps', 'triceps', 'biceps', 'triceps', 'core'] },
  core: { label: 'Core', groups: [], slots: ['core', 'core', 'core', 'core', 'core', 'core', 'core'] },
};

/** Focus choices offered for "I want to train … today". */
export const TODAY_CHOICES: FocusId[] = ['back', 'chest', 'shoulders', 'arms', 'legs', 'core', 'full'];

const EXERCISES_PER_SESSION: Record<Level, number> = { beginner: 5, intermediate: 6, advanced: 7 };

/** Which weekday indexes (Mon = 0) are training days, chosen to spread rest days out. */
const TRAINING_DAYS: Record<number, number[]> = {
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 4, 5],
  6: [0, 1, 2, 3, 4, 5],
};

const SPLITS: Record<number, FocusId[]> = {
  2: ['full', 'full'],
  3: ['full', 'full', 'full'],
  4: ['upper', 'lower', 'upper', 'lower'],
  5: ['push', 'pull', 'legs', 'upper', 'lower'],
  6: ['push', 'pull', 'legs', 'push', 'pull', 'legs'],
};

export function baseSplit(daysPerWeek: number): FocusId[] {
  return SPLITS[Math.min(6, Math.max(2, daysPerWeek))];
}

/** 0 = Monday … 6 = Sunday. */
export function dayIndexOf(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function weekStartOf(date: Date): string {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - dayIndexOf(date));
  return toISODate(monday);
}

export function dateOfDay(weekStart: string, index: number): string {
  const start = parseISODate(weekStart);
  return toISODate(new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
}

export function shareGroup(a: FocusId | null, b: FocusId | null): boolean {
  if (!a || !b) return false;
  return FOCI[a].groups.some((g) => FOCI[b].groups.includes(g));
}

function overlap(a: FocusId, b: FocusId): number {
  return FOCI[a].groups.filter((g) => FOCI[b].groups.includes(g)).length;
}

/** Sets and reps/seconds for a slot, scaled by level. */
function prescription(kind: 'reps' | 'time', level: Level, slotIndex: number): Pick<PlannedExercise, 'sets' | 'reps' | 'seconds'> {
  if (kind === 'time') {
    return { sets: level === 'advanced' ? 4 : 3, seconds: { beginner: 20, intermediate: 30, advanced: 45 }[level] };
  }
  const reps = { beginner: '10–12', intermediate: '8–12', advanced: '6–12' }[level];
  const sets = level === 'advanced' ? 4 : level === 'intermediate' && slotIndex < 2 ? 4 : 3;
  return { sets, reps };
}

/** Picks distinct exercises for each slot of a focus; `seed` rotates choices so repeated sessions differ. */
export function buildSession(focus: FocusId, level: Level, seed: number): PlannedExercise[] {
  const count = EXERCISES_PER_SESSION[level];
  const used = new Set<string>();
  const out: PlannedExercise[] = [];

  FOCI[focus].slots.slice(0, count).forEach((group, slotIndex) => {
    let pool = exercisesFor(group, level).filter((x) => !used.has(x.id));
    if (pool.length === 0) pool = exercisesFor('core', level).filter((x) => !used.has(x.id));
    if (pool.length === 0) return;
    const pick = pool[(seed * 2 + slotIndex) % pool.length];
    used.add(pick.id);
    out.push({ id: pick.id, ...prescription(pick.kind, level, slotIndex) });
  });
  return out;
}

const REST: DayPlan = { focus: null, exercises: [] };

export function buildWeek(profile: Profile, weekStart: string): Week {
  const days = TRAINING_DAYS[Math.min(6, Math.max(2, profile.daysPerWeek))];
  const split = baseSplit(profile.daysPerWeek);
  const plan: DayPlan[] = Array.from({ length: 7 }, () => REST);
  days.forEach((dayIndex, i) => {
    plan[dayIndex] = { focus: split[i], exercises: buildSession(split[i], profile.level, dayIndex) };
  });
  return { weekStart, days: plan };
}

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  return items.flatMap((item, i) =>
    permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]),
  );
}

function combinations(pool: number[], k: number): number[][] {
  if (k === 0) return [[]];
  if (pool.length < k) return [];
  const [head, ...tail] = pool;
  return [...combinations(tail, k - 1).map((c) => [head, ...c]), ...combinations(tail, k)];
}

/**
 * "I want to train `focus` today": today becomes that session and the sessions still owed this week
 * are re-placed on the remaining days. Days before today are never touched.
 * `completed` holds the day indexes already finished this week.
 */
export function rebalance(week: Week, profile: Profile, todayIndex: number, focus: FocusId, completed: number[]): Week {
  const days = week.days.map((d) => d);
  days[todayIndex] = { focus, exercises: buildSession(focus, profile.level, todayIndex + 3) };

  const doneBefore = completed.filter((i) => i < todayIndex);
  const owed = Math.max(0, profile.daysPerWeek - doneBefore.length - 1);

  // Which parts of the base split are still uncovered after the finished sessions and today's pick.
  const needed = [...baseSplit(profile.daysPerWeek)];
  const covered = [...doneBefore.map((i) => days[i].focus), focus].filter((f): f is FocusId => f !== null);
  for (const c of covered) {
    let best = -1;
    let bestScore = 0;
    needed.forEach((n, i) => {
      const score = overlap(c, n);
      if (score > bestScore) {
        best = i;
        bestScore = score;
      }
    });
    if (best >= 0) needed.splice(best, 1);
  }
  const split = baseSplit(profile.daysPerWeek);
  for (let i = 0; needed.length < owed; i++) needed.push(split[i % split.length]);

  const available = Array.from({ length: 6 - todayIndex }, (_, i) => todayIndex + 1 + i);
  let placed: { day: number; focus: FocusId }[] = [];
  let k = Math.min(owed, available.length);

  for (; k >= 0; k--) {
    let best: { cost: number; arrangement: { day: number; focus: FocusId }[] } | null = null;
    for (const dayCombo of combinations(available, k)) {
      for (const order of permutations(needed.slice(0, k))) {
        const sequence = [{ day: todayIndex, focus }, ...dayCombo.map((day, i) => ({ day, focus: order[i] }))];
        let valid = true;
        let cost = 0;
        for (let i = 1; i < sequence.length; i++) {
          const gap = sequence[i].day - sequence[i - 1].day;
          if (gap === 1 && shareGroup(sequence[i - 1].focus, sequence[i].focus)) valid = false;
          if (gap === 1) cost += 10;
          cost += gap * gap;
        }
        if (valid && (best === null || cost < best.cost)) best = { cost, arrangement: sequence.slice(1) };
      }
    }
    if (best) {
      placed = best.arrangement;
      break;
    }
  }

  for (let d = todayIndex + 1; d < 7; d++) days[d] = REST;
  for (const p of placed) days[p.day] = { focus: p.focus, exercises: buildSession(p.focus, profile.level, p.day) };

  const shortfall = owed - placed.length;
  const note =
    shortfall > 0
      ? `${shortfall} planned session${shortfall > 1 ? 's' : ''} left out: not enough days remain this week without training the same muscles back to back.`
      : undefined;
  return { weekStart: week.weekStart, days, note };
}
