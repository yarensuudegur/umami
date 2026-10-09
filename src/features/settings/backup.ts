import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { BACKUP_KEYS, backupFileName, emptyData, validateBackup, type Backup, type BackupData } from './backup-format';

async function readKey<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function buildBackup(): Promise<Backup> {
  const empty = emptyData();
  const data: BackupData = {
    pantry: await readKey(BACKUP_KEYS.pantry, empty.pantry),
    shopping: await readKey(BACKUP_KEYS.shopping, empty.shopping),
    workout: await readKey(BACKUP_KEYS.workout, empty.workout),
    settings: await readKey(BACKUP_KEYS.settings, empty.settings),
  };
  return { app: 'umami', version: 1, exportedAt: new Date().toISOString(), data };
}

/** Writes a backup JSON file to the cache and opens the share sheet (Save to Files, AirDrop, mail …). */
export async function exportBackup(): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
  const backup = await buildBackup();
  const file = new File(Paths.cache, backupFileName());
  file.create({ overwrite: true });
  file.write(JSON.stringify(backup, null, 2));
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle: 'Save your Umami backup',
  });
}

export type PickResult =
  | { status: 'cancelled' }
  | { status: 'invalid'; error: string }
  | { status: 'ok'; backup: Backup };

/** Lets the user pick a backup file and validates it without changing any data. */
export async function pickBackup(): Promise<PickResult> {
  const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (result.canceled || !result.assets?.[0]) return { status: 'cancelled' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(await new File(result.assets[0].uri).text());
  } catch {
    return { status: 'invalid', error: 'This file could not be read as an Umami backup.' };
  }
  const checked = validateBackup(parsed);
  return checked.ok ? { status: 'ok', backup: checked.backup } : { status: 'invalid', error: checked.error };
}

/** Replaces everything on this device with the backup. Callers must reload the providers afterwards. */
export async function applyBackup(backup: Backup): Promise<void> {
  await AsyncStorage.multiSet([
    [BACKUP_KEYS.pantry, JSON.stringify(backup.data.pantry)],
    [BACKUP_KEYS.shopping, JSON.stringify(backup.data.shopping)],
    [BACKUP_KEYS.workout, JSON.stringify(backup.data.workout)],
    [BACKUP_KEYS.settings, JSON.stringify(backup.data.settings)],
  ]);
}
