import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip } from '@/components/chip';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { DayStrip } from '@/features/workout/day-strip';
import { ExerciseCard } from '@/features/workout/exercise-card';
import { HistoryView } from '@/features/workout/history-view';
import { DAY_NAMES, FOCI, dateOfDay } from '@/features/workout/plan';
import { PlanSetup } from '@/features/workout/plan-setup';
import { TrainTodaySheet } from '@/features/workout/train-today-sheet';
import { useWorkout } from '@/features/workout/workout-provider';
import { useTheme } from '@/hooks/use-theme';

export default function WorkoutScreen() {
  const theme = useTheme();
  const { loaded, profile, week, history, progress, todayIndex, todayISO, completedDays, savePlan, toggleExercise, finishWorkout, trainToday } =
    useWorkout();
  const [tab, setTab] = useState<'week' | 'history'>('week');
  const [picked, setPicked] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [trainOpen, setTrainOpen] = useState(false);

  if (!loaded) return <ThemedView style={styles.flex} />;

  if (!profile || !week) {
    return (
      <ThemedView style={styles.flex}>
        <SafeAreaView style={styles.flex} edges={['top']}>
          <ScrollView contentContainerStyle={styles.content}>
            <ThemedText style={styles.title}>Workout</ThemedText>
            <ThemedText style={styles.big}>Let&apos;s build your week 💪</ThemedText>
            <ThemedText themeColor="textSecondary">
              Tell me how often you can train and your level. I will plan a balanced week with rest days.
            </ThemedText>
            <View style={styles.setupGap} />
            <PlanSetup submitLabel="Build my plan" onSubmit={savePlan} />
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const selected = picked ?? todayIndex;
  const day = week.days[selected];
  const date = dateOfDay(week.weekStart, selected);
  const isToday = selected === todayIndex;
  const finished = completedDays.includes(selected);
  const finishedEntry = history.find((h) => h.date === date);
  const ticked = new Set(progress[date] ?? []);

  const finish = () => {
    const total = day.exercises.length;
    const done = ticked.size;
    const message =
      done === 0 ? 'You have not ticked any exercise yet.' : done < total ? `You completed ${done} of ${total} exercises.` : null;
    if (!message) return finishWorkout(date);
    Alert.alert('Finish workout?', message, [
      { text: 'Keep going', style: 'cancel' },
      { text: 'Finish', onPress: () => finishWorkout(date) },
    ]);
  };

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.titleRow}>
            <ThemedText style={styles.title}>Workout</ThemedText>
            <Pressable onPress={() => setEditing(true)} hitSlop={12} accessibilityLabel="Edit plan">
              <Ionicons name="options-outline" size={26} color={theme.text} />
            </Pressable>
          </View>
          <ThemedText themeColor="textSecondary">
            {profile.daysPerWeek} days a week · {profile.level}
          </ThemedText>

          <View style={styles.tabs}>
            <Chip label="This week" selected={tab === 'week'} onPress={() => setTab('week')} />
            <Chip label={`History (${history.length})`} selected={tab === 'history'} onPress={() => setTab('history')} />
          </View>

          {tab === 'history' ? (
            <HistoryView history={history} />
          ) : (
            <>
              <DayStrip week={week} selected={selected} todayIndex={todayIndex} completedDays={completedDays} onSelect={setPicked} />

              {week.note && (
                <View style={[styles.note, { backgroundColor: theme.cautionSoft }]}>
                  <ThemedText type="small" style={{ color: theme.caution }}>{week.note}</ThemedText>
                </View>
              )}

              <View style={styles.dayHeader}>
                <ThemedText style={styles.big}>
                  {DAY_NAMES[selected]}
                  {isToday ? ' · Today' : ''}
                </ThemedText>
                <ThemedText themeColor="textSecondary">
                  {day.focus ? `${FOCI[day.focus].label} · ${day.exercises.length} exercises · ~${day.exercises.length * 6} min` : 'Rest day'}
                </ThemedText>
              </View>

              {finished && (
                <View style={[styles.note, { backgroundColor: theme.accentSoft }]}>
                  <ThemedText style={{ color: theme.accent, fontWeight: '700' }}>
                    ✓ Workout done
                    {finishedEntry ? ` · ${finishedEntry.exercises.filter((e) => e.done).length}/${finishedEntry.exercises.length} exercises` : ''}
                  </ThemedText>
                </View>
              )}

              {!day.focus ? (
                <View style={[styles.rest, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                  <ThemedText style={styles.restEmoji}>🌿</ThemedText>
                  <ThemedText style={styles.restTitle}>Recovery day</ThemedText>
                  <ThemedText themeColor="textSecondary" style={styles.center}>
                    Muscles grow while you rest. A relaxed walk, some stretching and plenty of water and protein are perfect today.
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.exercises}>
                  {day.exercises.map((planned) => (
                    <ExerciseCard
                      key={planned.id}
                      planned={planned}
                      done={finished ? !!finishedEntry?.exercises.find((e) => e.id === planned.id)?.done : ticked.has(planned.id)}
                      interactive={isToday && !finished}
                      onToggle={() => toggleExercise(todayISO, planned.id)}
                    />
                  ))}
                </View>
              )}

              {isToday && !finished && (
                <View style={styles.actions}>
                  {day.focus && (
                    <Pressable onPress={finish} style={({ pressed }) => [styles.primary, { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 }]}>
                      <Ionicons name="flag" size={20} color={theme.onAccent} />
                      <ThemedText style={{ color: theme.onAccent, fontWeight: '700', fontSize: 16 }}>Finish workout</ThemedText>
                    </Pressable>
                  )}
                  <Pressable onPress={() => setTrainOpen(true)} style={[styles.secondary, { borderColor: theme.accent }]}>
                    <Ionicons name="swap-horizontal" size={20} color={theme.accent} />
                    <ThemedText style={{ color: theme.accent, fontWeight: '700' }}>
                      {day.focus ? 'I want to train something else today' : 'I want to train today'}
                    </ThemedText>
                  </Pressable>
                </View>
              )}
            </>
          )}

          <ThemedText type="small" themeColor="textSecondary" style={styles.credit}>
            Exercise photos: free-exercise-db (public domain, The Unlicense).
          </ThemedText>
        </ScrollView>
      </SafeAreaView>

      {editing && (
        <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditing(false)}>
          <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
            <View style={[styles.titleRow, { padding: Spacing.four }]}>
              <ThemedText style={styles.big}>Edit plan</ThemedText>
              <Pressable onPress={() => setEditing(false)} hitSlop={12}>
                <ThemedText style={{ color: theme.accent, fontWeight: '700' }}>Cancel</ThemedText>
              </Pressable>
            </View>
            <View style={{ paddingHorizontal: Spacing.four }}>
              <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.three }}>
                Rebuilds today and the rest of this week. Days that already passed stay as they were.
              </ThemedText>
              <PlanSetup
                initial={profile}
                submitLabel="Rebuild my week"
                onSubmit={(p) => {
                  savePlan(p);
                  setPicked(null);
                  setEditing(false);
                }}
              />
            </View>
          </SafeAreaView>
        </Modal>
      )}

      {trainOpen && (
        <TrainTodaySheet
          onClose={() => setTrainOpen(false)}
          onPick={(focus) => {
            trainToday(focus);
            setPicked(null);
            setTrainOpen(false);
          }}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.six, gap: Spacing.three },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 34, fontWeight: '800', lineHeight: 40 },
  big: { fontSize: 22, fontWeight: '800' },
  setupGap: { height: Spacing.two },
  tabs: { flexDirection: 'row', gap: Spacing.two },
  note: { padding: Spacing.three, borderRadius: Radius.md },
  dayHeader: { gap: 2, marginTop: Spacing.one },
  exercises: { gap: Spacing.two + 2 },
  rest: { alignItems: 'center', gap: Spacing.two, padding: Spacing.four, borderRadius: Radius.md, borderWidth: 1 },
  restEmoji: { fontSize: 44, lineHeight: 56 },
  restTitle: { fontSize: 18, fontWeight: '700' },
  center: { textAlign: 'center' },
  actions: { gap: Spacing.two + 2, marginTop: Spacing.two },
  primary: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center', justifyContent: 'center', padding: Spacing.three, borderRadius: Radius.md },
  secondary: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center', justifyContent: 'center', padding: Spacing.three, borderRadius: Radius.md, borderWidth: 1.5 },
  credit: { textAlign: 'center', marginTop: Spacing.three },
});
