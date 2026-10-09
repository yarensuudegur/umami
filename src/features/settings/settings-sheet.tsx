import { useState } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip } from '@/components/chip';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { ensurePermission, notificationsSupported, sendTestNotification } from '@/features/notifications/notifications';
import { useTheme } from '@/hooks/use-theme';

import { applyBackup, exportBackup, pickBackup } from './backup';
import { summarize } from './backup-format';
import { useDataReload } from './data-root';
import type { NotificationPrefs } from './settings-model';
import { useSettings } from './settings-provider';

type Toggle = { key: 'expiry' | 'ranOut' | 'workout'; hourKey: 'expiryHour' | 'ranOutHour' | 'workoutHour'; title: string; hint: string; hours: number[] };

const TOGGLES: Toggle[] = [
  { key: 'expiry', hourKey: 'expiryHour', title: 'Items about to expire', hint: 'A daily heads-up for food that expires within 3 days.', hours: [7, 8, 9, 10] },
  { key: 'ranOut', hourKey: 'ranOutHour', title: 'Items that ran out', hint: 'Reminds you to restock while they are still on your shopping list.', hours: [16, 17, 18, 19] },
  { key: 'workout', hourKey: 'workoutHour', title: 'Workout reminder', hint: 'On your training days.', hours: [6, 7, 12, 17, 18, 19] },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary">{title}</ThemedText>
      {children}
    </View>
  );
}

/** Mounted fresh on each open so the goal input starts from the saved value. */
export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const theme = useTheme();
  const { settings, setDailyProteinGoal, updateNotifications } = useSettings();
  const reloadAll = useDataReload();
  const [goal, setGoal] = useState(String(settings.dailyProteinGoal));
  const [busy, setBusy] = useState(false);

  const done = () => {
    const value = Number(goal.replace(',', '.'));
    if (!Number.isFinite(value) || value < 10 || value > 400) {
      return Alert.alert('Invalid goal', 'Enter a daily protein goal between 10 and 400 g.');
    }
    setDailyProteinGoal(Math.round(value));
    onClose();
  };

  const permissionDenied = () =>
    Alert.alert('Notifications are off', 'Allow notifications for this app in your phone settings to get reminders.', [
      { text: 'Not now', style: 'cancel' },
      { text: 'Open settings', onPress: () => Linking.openSettings() },
    ]);

  const setToggle = async (toggle: Toggle, on: boolean) => {
    if (on) {
      if (!notificationsSupported) return Alert.alert('Not available', 'Notifications do not work on web.');
      try {
        if (!(await ensurePermission())) return permissionDenied();
      } catch (error) {
        console.error('[notifications] permission request failed:', error);
        return Alert.alert('Could not ask for permission', error instanceof Error ? error.message : String(error));
      }
    }
    updateNotifications({ [toggle.key]: on } as Partial<NotificationPrefs>);
  };

  const test = async () => {
    if (!notificationsSupported) return Alert.alert('Not available', 'Notifications do not work on web.');
    try {
      if (!(await ensurePermission())) return permissionDenied();
      await sendTestNotification(5);
      Alert.alert('Test sent', 'A notification will arrive in about 5 seconds. Try locking your phone.');
    } catch (error) {
      Alert.alert('Could not schedule the notification', error instanceof Error ? error.message : String(error));
    }
  };

  const doExport = async () => {
    setBusy(true);
    try {
      await exportBackup();
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const doImport = async () => {
    setBusy(true);
    try {
      const picked = await pickBackup();
      if (picked.status === 'cancelled') return;
      if (picked.status === 'invalid') return Alert.alert('Cannot import', picked.error);
      const { backup } = picked;
      Alert.alert('Replace all data?', `This backup contains ${summarize(backup)}.\n\nEverything currently on this device will be replaced.`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Replace',
          style: 'destructive',
          onPress: async () => {
            try {
              await applyBackup(backup);
              reloadAll();
            } catch {
              Alert.alert('Import failed', 'Your data could not be written. Nothing was changed.');
            }
          },
        },
      ]);
    } catch (e) {
      Alert.alert('Import failed', e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const card = [styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }];

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Settings</ThemedText>
          <Pressable onPress={done} hitSlop={12}>
            <ThemedText style={{ color: theme.accent, fontWeight: '700' }}>Done</ThemedText>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Section title="DAILY PROTEIN GOAL (g)">
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundElement, borderColor: theme.border, color: theme.text }]}
              value={goal}
              onChangeText={setGoal}
              keyboardType="number-pad"
              placeholder="120"
              placeholderTextColor={theme.textSecondary}
            />
            <ThemedText type="small" themeColor="textSecondary">
              Recipes show how much of this goal one serving covers, and Today uses it to suggest what to cook.
            </ThemedText>
          </Section>

          <Section title="NOTIFICATIONS">
            {TOGGLES.map((t) => {
              const on = settings.notifications[t.key];
              return (
                <View key={t.key} style={card}>
                  <View style={styles.toggleRow}>
                    <View style={styles.flex}>
                      <ThemedText style={styles.toggleTitle}>{t.title}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">{t.hint}</ThemedText>
                    </View>
                    <Switch
                      value={on}
                      onValueChange={(v) => setToggle(t, v)}
                      trackColor={{ true: theme.accent }}
                    />
                  </View>
                  {on && (
                    <View style={styles.hours}>
                      {t.hours.map((h) => (
                        <Chip key={h} label={`${h}:00`} selected={settings.notifications[t.hourKey] === h} onPress={() => updateNotifications({ [t.hourKey]: h } as Partial<NotificationPrefs>)} />
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
            <Pressable onPress={test} style={[styles.outline, { borderColor: theme.accent }]}>
              <ThemedText style={{ color: theme.accent, fontWeight: '700' }}>Send a test notification</ThemedText>
            </Pressable>
          </Section>

          <Section title="YOUR DATA">
            <ThemedText type="small" themeColor="textSecondary">
              Everything lives on this device. Export a backup file to keep it safe or move it to another phone.
            </ThemedText>
            <Pressable disabled={busy} onPress={doExport} style={[styles.outline, { borderColor: theme.accent, opacity: busy ? 0.5 : 1 }]}>
              <ThemedText style={{ color: theme.accent, fontWeight: '700' }}>Export all data</ThemedText>
            </Pressable>
            <Pressable disabled={busy} onPress={doImport} style={[styles.outline, { borderColor: theme.accent, opacity: busy ? 0.5 : 1 }]}>
              <ThemedText style={{ color: theme.accent, fontWeight: '700' }}>Import from backup file</ThemedText>
            </Pressable>
          </Section>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
  title: { fontSize: 28, fontWeight: '800' },
  content: { padding: Spacing.four, paddingTop: Spacing.one, gap: Spacing.four, paddingBottom: Spacing.six },
  section: { gap: Spacing.two },
  input: { borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.three, paddingVertical: 14, fontSize: 16 },
  card: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.three, gap: Spacing.three },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  toggleTitle: { fontSize: 16, fontWeight: '700' },
  hours: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  outline: { alignItems: 'center', padding: Spacing.three, borderRadius: Radius.md, borderWidth: 1.5 },
});
