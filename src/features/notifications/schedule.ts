import { EXPIRING_SOON_DAYS, parseISODate, toISODate } from '@/features/pantry/status';
import type { PantryItem } from '@/features/pantry/types';
import type { NotificationPrefs } from '@/features/settings/settings-model';
import type { ShoppingEntry } from '@/features/shopping/types';
import { FOCI, buildWeek, dateOfDay } from '@/features/workout/plan';
import type { Profile, Week } from '@/features/workout/types';

export type PlannedNotification = { id: string; title: string; body: string; date: Date };

export type ScheduleInput = {
  now: Date;
  prefs: NotificationPrefs;
  pantry: PantryItem[];
  shopping: ShoppingEntry[];
  profile: Profile | null;
  week: Week | null;
  /** ISO dates that already have a finished workout. */
  completedDates: string[];
};

const EXPIRY_DAYS_AHEAD = 14;
const RESTOCK_DAYS_AHEAD = 3;

function atHour(day: Date, hour: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0, 0, 0);
}

function addDays(day: Date, n: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() + n);
}

function listNames(names: string[]): string {
  if (names.length <= 3) return names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  return `${names.slice(0, 2).join(', ')} and ${names.length - 2} more`;
}

function expiryText(name: string, daysLeft: number): string {
  if (daysLeft < 0) return `${name} ${daysLeft === -1 ? 'expired yesterday' : `expired ${-daysLeft} days ago`}`;
  if (daysLeft === 0) return `${name} expires today`;
  if (daysLeft === 1) return `${name} expires tomorrow`;
  return `${name} expires in ${daysLeft} days`;
}

/** Everything that should be scheduled right now. Only future moments are returned. */
export function buildSchedule({ now, prefs, pantry, shopping, profile, week, completedDates }: ScheduleInput): PlannedNotification[] {
  const out: PlannedNotification[] = [];
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (prefs.expiry) {
    for (let d = 0; d < EXPIRY_DAYS_AHEAD; d++) {
      const day = addDays(today, d);
      const fireAt = atHour(day, prefs.expiryHour);
      if (fireAt <= now) continue;
      const due = pantry
        .filter((it) => it.expiryDate)
        .map((it) => ({ it, left: Math.round((parseISODate(it.expiryDate!).getTime() - day.getTime()) / 86_400_000) }))
        .filter(({ left }) => left <= EXPIRING_SOON_DAYS && left >= -3)
        .sort((a, b) => a.left - b.left);
      if (due.length === 0) continue;
      const body =
        due.length === 1
          ? expiryText(due[0].it.name, due[0].left)
          : `${listNames(due.map((x) => x.it.name))} need to be used soon.`;
      out.push({ id: `expiry-${toISODate(day)}`, title: 'Use it before you lose it 🥬', body, date: fireAt });
    }
  }

  if (prefs.ranOut) {
    const pending = shopping.filter((e) => !e.checked && e.kind === 'item' && e.source === 'auto');
    if (pending.length > 0) {
      const out_ = pending.filter((e) => e.reason === 'out').map((e) => e.name);
      const low = pending.filter((e) => e.reason !== 'out').map((e) => e.name);
      const parts = [out_.length ? `Ran out: ${listNames(out_)}.` : '', low.length ? `Running low: ${listNames(low)}.` : ''];
      const body = parts.filter(Boolean).join(' ');
      for (let d = 0; d < RESTOCK_DAYS_AHEAD; d++) {
        const day = addDays(today, d);
        const fireAt = atHour(day, prefs.ranOutHour);
        if (fireAt <= now) continue;
        out.push({ id: `restock-${toISODate(day)}`, title: 'Time to restock 🛒', body, date: fireAt });
      }
    }
  }

  if (prefs.workout && profile && week) {
    const nextWeek = buildWeek(profile, toISODate(addDays(parseISODate(week.weekStart), 7)));
    for (const w of [week, nextWeek]) {
      w.days.forEach((day, i) => {
        if (!day.focus) return;
        const iso = dateOfDay(w.weekStart, i);
        if (completedDates.includes(iso)) return;
        const fireAt = atHour(parseISODate(iso), prefs.workoutHour);
        if (fireAt <= now) return;
        out.push({
          id: `workout-${iso}`,
          title: 'Workout time 💪',
          body: `Today: ${FOCI[day.focus].label} · ${day.exercises.length} exercises`,
          date: fireAt,
        });
      });
    }
  }

  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}

