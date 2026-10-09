export const SETTINGS_KEY = 'umami.settings.v1';

export type NotificationPrefs = {
  /** Daily digest of items that are expired or about to expire. */
  expiry: boolean;
  /** Reminder for items that ran out or are running low and are still on the shopping list. */
  ranOut: boolean;
  /** Reminder on training days. */
  workout: boolean;
  /** Local hour of day (0-23) for each notification. */
  expiryHour: number;
  ranOutHour: number;
  workoutHour: number;
};

export type Settings = { dailyProteinGoal: number; notifications: NotificationPrefs };

export const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  expiry: false,
  ranOut: false,
  workout: false,
  expiryHour: 9,
  ranOutHour: 17,
  workoutHour: 18,
};
export const DEFAULT_SETTINGS: Settings = { dailyProteinGoal: 120, notifications: DEFAULT_NOTIFICATIONS };

const isHour = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 23;

/** Merges stored (possibly older or hand-edited) data over the defaults. */
export function parseSettings(raw: unknown): Settings {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>;
  const goal = Number(obj.dailyProteinGoal);
  const n = (obj.notifications && typeof obj.notifications === 'object' ? obj.notifications : {}) as Record<string, any>;
  return {
    dailyProteinGoal: Number.isFinite(goal) && goal > 0 ? goal : DEFAULT_SETTINGS.dailyProteinGoal,
    notifications: {
      expiry: n.expiry === true,
      ranOut: n.ranOut === true,
      workout: n.workout === true,
      expiryHour: isHour(n.expiryHour) ? n.expiryHour : DEFAULT_NOTIFICATIONS.expiryHour,
      ranOutHour: isHour(n.ranOutHour) ? n.ranOutHour : DEFAULT_NOTIFICATIONS.ranOutHour,
      workoutHour: isHour(n.workoutHour) ? n.workoutHour : DEFAULT_NOTIFICATIONS.workoutHour,
    },
  };
}
