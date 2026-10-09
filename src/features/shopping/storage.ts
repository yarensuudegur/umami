import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ShoppingEntry } from './types';

const KEY = 'umami.shopping.v1';

export async function loadShopping(): Promise<ShoppingEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveShopping(entries: ShoppingEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // Storage failures are non-fatal; state stays in memory.
  }
}
