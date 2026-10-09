import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { PlannedNotification } from './schedule';

/** Local notifications are not available on web (e.g. the Snack web preview). */
export const notificationsSupported = Platform.OS !== 'web';

const CHANNEL_ID = 'default';
/** The test notification must survive the automatic re-syncs, so it is never cancelled by them. */
const TEST_ID = 'umami-test';

if (notificationsSupported) {
  // Without a handler iOS does not show notifications while the app is open. Show them as a banner.
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      console.log('[notifications] showing in foreground:', notification.request.content.title);
      return {
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      };
    },
  });
  Notifications.addNotificationReceivedListener((n) => {
    console.log('[notifications] received:', n.request.identifier, n.request.content.title);
  });
}

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Umami reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  } catch (error) {
    // Not fatal; the default channel is used.
    console.error('[notifications] could not create the Android channel:', error);
  }
}

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export async function getPermissionState(): Promise<PermissionState> {
  if (!notificationsSupported) return 'denied';
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return 'granted';
  return status === 'undetermined' || canAskAgain ? 'undetermined' : 'denied';
}

/** Asks for permission if needed. Returns true when notifications may be shown. */
export async function ensurePermission(): Promise<boolean> {
  if (!notificationsSupported) return false;
  await ensureChannel();
  const current = await Notifications.getPermissionsAsync();
  console.log('[notifications] permission status:', current.status, 'canAskAgain:', current.canAskAgain);
  if (current.status === 'granted') return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  console.log('[notifications] permission after asking:', asked.status);
  return asked.status === 'granted';
}

// Syncs run one after another so overlapping state changes cannot interleave cancel/schedule calls.
let chain: Promise<void> = Promise.resolve();

/** Replaces everything that is scheduled with `list` (does nothing if permission was not granted). */
export function syncNotifications(list: PlannedNotification[]): Promise<void> {
  if (!notificationsSupported) return Promise.resolve();
  chain = chain
    .then(async () => {
      // Cancel only our own scheduled reminders; a pending test notification is left alone.
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      await Promise.all(
        scheduled
          .filter((s) => s.identifier !== TEST_ID)
          .map((s) => Notifications.cancelScheduledNotificationAsync(s.identifier)),
      );
      if (list.length === 0) return;
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        console.log('[notifications] not scheduling reminders, permission is', status);
        return;
      }
      await ensureChannel();
      for (const n of list) {
        await Notifications.scheduleNotificationAsync({
          identifier: n.id,
          content: { title: n.title, body: n.body },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.date, channelId: CHANNEL_ID },
        });
      }
      console.log('[notifications] scheduled', list.length, 'reminders');
    })
    .catch((error) => {
      console.error('[notifications] scheduling failed:', error);
    });
  return chain;
}

/** Fires a notification in a few seconds so the user can check that everything works. Throws if scheduling fails. */
export async function sendTestNotification(seconds = 5): Promise<string> {
  try {
    await ensureChannel();
    const id = await Notifications.scheduleNotificationAsync({
      identifier: TEST_ID,
      content: { title: 'Umami 🌸', body: 'Notifications are working. Balance is served.' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, channelId: CHANNEL_ID },
    });
    const pending = await Notifications.getAllScheduledNotificationsAsync();
    console.log('[notifications] test scheduled:', id, 'pending now:', pending.map((p) => p.identifier));
    return id;
  } catch (error) {
    console.error('[notifications] scheduling the test notification failed:', error);
    throw error;
  }
}
