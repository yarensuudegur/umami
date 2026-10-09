// Pure helpers for the backup file format (no Expo imports, so they are easy to test).

export const BACKUP_KEYS = {
  pantry: 'umami.pantry.v1',
  shopping: 'umami.shopping.v1',
  workout: 'umami.workout.v1',
  settings: 'umami.settings.v1',
} as const;

export type BackupData = {
  pantry: unknown[];
  shopping: unknown[];
  workout: { profile: unknown; week: unknown; progress: Record<string, unknown>; history: unknown[] };
  settings: Record<string, unknown>;
};

export type Backup = { app: 'umami'; version: 1; exportedAt: string; data: BackupData };

const UNITS = ['g', 'kg', 'ml', 'l', 'pcs'];
const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

export function emptyData(): BackupData {
  return { pantry: [], shopping: [], workout: { profile: null, week: null, progress: {}, history: [] }, settings: {} };
}

export function backupFileName(date = new Date()): string {
  const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return `umami-backup-${iso}.json`;
}

/** Checks that parsed JSON is a complete Umami backup; returns the cleaned backup or a readable error. */
export function validateBackup(parsed: unknown): { ok: true; backup: Backup } | { ok: false; error: string } {
  if (!isObject(parsed) || parsed.app !== 'umami') return { ok: false, error: 'This file is not an Umami backup.' };
  if (parsed.version !== 1) return { ok: false, error: `Unsupported backup version (${String(parsed.version)}).` };
  const data = parsed.data;
  if (!isObject(data)) return { ok: false, error: 'The backup has no data.' };

  const { pantry, shopping, workout, settings } = data;
  if (!Array.isArray(pantry)) return { ok: false, error: 'The pantry data is damaged.' };
  for (const it of pantry) {
    if (!isObject(it) || typeof it.id !== 'string' || typeof it.name !== 'string' || !Number.isFinite(it.quantity) || !UNITS.includes(it.unit as string)) {
      return { ok: false, error: 'The pantry data is damaged.' };
    }
  }
  if (!Array.isArray(shopping)) return { ok: false, error: 'The shopping list data is damaged.' };
  for (const e of shopping) {
    if (!isObject(e) || typeof e.id !== 'string' || typeof e.name !== 'string' || (e.kind !== 'item' && e.kind !== 'note')) {
      return { ok: false, error: 'The shopping list data is damaged.' };
    }
  }
  if (!isObject(workout) || !Array.isArray(workout.history) || !(workout.progress === undefined || isObject(workout.progress))) {
    return { ok: false, error: 'The workout data is damaged.' };
  }
  if (!isObject(settings)) return { ok: false, error: 'The settings data is damaged.' };

  return {
    ok: true,
    backup: {
      app: 'umami',
      version: 1,
      exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : '',
      data: {
        pantry,
        shopping,
        workout: {
          profile: workout.profile ?? null,
          week: workout.week ?? null,
          progress: (workout.progress as Record<string, unknown>) ?? {},
          history: workout.history,
        },
        settings,
      },
    },
  };
}

export function summarize(backup: Backup): string {
  const { pantry, shopping, workout } = backup.data;
  return `${pantry.length} pantry items, ${shopping.length} shopping entries, ${workout.history.length} workouts`;
}
