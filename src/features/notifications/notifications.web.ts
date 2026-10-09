// Web build: local notifications are not available in the browser, so this stub keeps the same API
// without importing expo-notifications (which only logs warnings on web).
import type { PlannedNotification } from './schedule';

export const notificationsSupported = false;

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export async function getPermissionState(): Promise<PermissionState> {
  return 'denied';
}

export async function ensurePermission(): Promise<boolean> {
  return false;
}

export async function syncNotifications(_list: PlannedNotification[]): Promise<void> {}
