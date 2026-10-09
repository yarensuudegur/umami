import Ionicons from '@expo/vector-icons/Ionicons';
import { View, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { parseISODate } from '@/features/pantry/status';
import { useTheme } from '@/hooks/use-theme';

import { FOCI } from './plan';
import type { HistoryEntry } from './types';

function formatDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function HistoryView({ history }: { history: HistoryEntry[] }) {
  const theme = useTheme();

  if (history.length === 0) {
    return (
      <View style={styles.empty}>
        <ThemedText style={styles.emptyEmoji}>📒</ThemedText>
        <ThemedText style={styles.emptyTitle}>No workouts yet</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.center}>
          Finish a workout and it will show up here.
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {history.map((h) => {
        const done = h.exercises.filter((e) => e.done).length;
        return (
          <View key={h.id} style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={styles.row}>
              <View style={styles.flex}>
                <ThemedText style={styles.title}>{FOCI[h.focus].label}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">{formatDate(h.date)}</ThemedText>
              </View>
              <View style={[styles.pill, { backgroundColor: done === h.exercises.length ? theme.accentSoft : theme.cautionSoft }]}>
                <ThemedText style={[styles.pillText, { color: done === h.exercises.length ? theme.accent : theme.caution }]}>
                  {done}/{h.exercises.length} exercises
                </ThemedText>
              </View>
            </View>
            {h.exercises.map((e) => (
              <View key={e.id} style={styles.exRow}>
                <Ionicons name={e.done ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={e.done ? theme.accent : theme.textSecondary} />
                <ThemedText type="small" style={e.done ? undefined : { color: theme.textSecondary }}>{e.name}</ThemedText>
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { gap: Spacing.three },
  card: { padding: Spacing.three, borderRadius: Radius.md, borderWidth: 1, gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  title: { fontSize: 18, fontWeight: '700' },
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.pill },
  pillText: { fontSize: 12, fontWeight: '700', lineHeight: 16 },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  empty: { alignItems: 'center', gap: Spacing.two, paddingTop: Spacing.five },
  emptyEmoji: { fontSize: 56, lineHeight: 70 },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  center: { textAlign: 'center' },
});
