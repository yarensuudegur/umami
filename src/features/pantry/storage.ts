import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PantryItem } from './types';

const KEY = 'umami.pantry.v1';

export async function loadPantry(): Promise<PantryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function savePantry(items: PantryItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // Storage failures are non-fatal; state stays in memory.
  }
}
