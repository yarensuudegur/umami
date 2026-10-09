import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { UmamiMark } from '@/components/umami-mark';
import { Radius, Spacing } from '@/constants/theme';
import { usePantry } from '@/features/pantry/pantry-provider';
import { daysUntilExpiry, isExpired, isExpiringSoon, isLow } from '@/features/pantry/status';
import { categoryEmoji, type PantryItem } from '@/features/pantry/types';
import { RecipeCard } from '@/features/recipes/recipe-card';
import { RecipeDetail } from '@/features/recipes/recipe-detail';
import type { Recipe } from '@/features/recipes/types';
import { normalizeName } from '@/features/recipes/matching';
import { SettingsSheet } from '@/features/settings/settings-sheet';
import { useSettings } from '@/features/settings/settings-provider';
import { useShopping } from '@/features/shopping/shopping-provider';
import { RestBanner } from '@/features/today/rest-banner';
import { rankRecipes } from '@/features/today/suggest';
import { TasteCard } from '@/features/today/taste-card';
import { FOCI } from '@/features/workout/plan';
import { getExercise } from '@/features/workout/exercises';
import { useWorkout } from '@/features/workout/workout-provider';
import { useTheme } from '@/hooks/use-theme';

function greeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function expiryLabel(item: PantryItem): string {
  const days = daysUntilExpiry(item);
  if (days === null) return '';
  if (days < 0) return 'Expired';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

function Row({ emoji, name, detail, badge, tone }: { emoji: string; name: string; detail: string; badge: string; tone: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText style={styles.rowEmoji}>{emoji}</ThemedText>
      <View style={styles.flex}>
        <ThemedText style={styles.rowName} numberOfLines={1}>{name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">{detail}</ThemedText>
      </View>
      <ThemedText style={[styles.rowBadge, { color: tone }]}>{badge}</ThemedText>
    </View>
  );
}

export default function TodayScreen() {
  const theme = useTheme();
  const { items } = usePantry();
  const { entries } = useShopping();
  const { settings } = useSettings();
  const { profile, week, todayIndex, completedDays, progress, todayISO } = useWorkout();
  const [suggestion, setSuggestion] = useState(0);
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Re-read the clock when the day changes (todayISO) so the greeting and date stay current.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `todayISO` is the trigger for re-reading the clock.
  const now = useMemo(() => new Date(), [todayISO]);
  const day = week?.days[todayIndex];
  const workoutDone = completedDays.includes(todayIndex);
  const trainingToday = !!day?.focus;

  const expiring = useMemo(
    () =>
      items
        .filter((it) => isExpired(it) || isExpiringSoon(it))
        .sort((a, b) => (daysUntilExpiry(a) ?? 0) - (daysUntilExpiry(b) ?? 0)),
    [items],
  );

  const low = useMemo(() => {
    const lowItems = items.filter(isLow);
    const known = new Set(lowItems.map((it) => normalizeName(it.name)));
    const ranOut = entries.filter((e) => !e.checked && e.kind === 'item' && e.source === 'auto' && e.reason === 'out' && !known.has(normalizeName(e.name)));
    return { lowItems, ranOut };
  }, [items, entries]);

  const ranked = useMemo(
    () => rankRecipes(items, settings.dailyProteinGoal, trainingToday),
    [items, settings.dailyProteinGoal, trainingToday],
  );
  const current = ranked[suggestion % ranked.length];
  const goalPct = Math.round((current.recipe.proteinPerServing / settings.dailyProteinGoal) * 100);
  const ticked = progress[todayISO]?.length ?? 0;

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <UmamiMark size={44} />
            <View style={styles.flex}>
              <ThemedText style={styles.title}>{greeting(now.getHours())}</ThemedText>
              <ThemedText themeColor="textSecondary">
                {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </ThemedText>
            </View>
            <Pressable onPress={() => setSettingsOpen(true)} hitSlop={12} accessibilityLabel="Settings">
              <Ionicons name="settings-outline" size={26} color={theme.text} />
            </Pressable>
          </View>

          {Platform.OS === 'web' && (
            <View style={[styles.webNote, { backgroundColor: theme.accentSoft }]}>
              <ThemedText type="small" themeColor="textSecondary">
                Web demo: your data stays in this browser. Reminders and the date picker are only in the mobile app.
              </ThemedText>
            </View>
          )}

          {/* Workout or rest day */}
          {profile && week && !trainingToday ? (
            <RestBanner dayIndex={todayIndex} />
          ) : (
            <TasteCard
              taste="umami"
              emoji="💪"
              title="Today's workout"
              actionLabel={profile ? 'Open' : undefined}
              onAction={() => router.navigate('/workout')}>
              {!profile || !day ? (
                <>
                  <ThemedText>Tell me how often you train and I will plan a balanced week with rest days.</ThemedText>
                  <Pressable onPress={() => router.navigate('/workout')} style={[styles.button, { backgroundColor: theme.accent }]}>
                    <ThemedText style={{ color: theme.onAccent, fontWeight: '700' }}>Plan your week</ThemedText>
                  </Pressable>
                </>
              ) : workoutDone ? (
                <ThemedText style={{ fontWeight: '700', color: theme.umami }}>✓ Workout done. Great job today!</ThemedText>
              ) : (
                <>
                  <ThemedText style={styles.big}>
                    {FOCI[day.focus!].label} · {day.exercises.length} exercises
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                    {day.exercises.slice(0, 3).map((e) => getExercise(e.id)?.name).filter(Boolean).join(', ')}
                    {day.exercises.length > 3 ? ' …' : ''}
                  </ThemedText>
                  <Pressable onPress={() => router.navigate('/workout')} style={[styles.button, { backgroundColor: theme.accent }]}>
                    <ThemedText style={{ color: theme.onAccent, fontWeight: '700' }}>
                      {ticked > 0 ? `Continue (${ticked}/${day.exercises.length} done)` : 'Start workout'}
                    </ThemedText>
                  </Pressable>
                </>
              )}
            </TasteCard>
          )}

          {/* Expiring soon */}
          <TasteCard taste="sour" emoji="⏰" title="Expiring soon" actionLabel="Pantry" onAction={() => router.navigate('/pantry')}>
            {expiring.length === 0 ? (
              <ThemedText themeColor="textSecondary">Nothing is about to expire. Your fridge is in good shape 🎉</ThemedText>
            ) : (
              expiring.slice(0, 5).map((it) => (
                <Row
                  key={it.id}
                  emoji={categoryEmoji(it.category)}
                  name={it.name}
                  detail={`${it.quantity} ${it.unit}`}
                  badge={expiryLabel(it)}
                  tone={isExpired(it) ? theme.danger : theme.sour}
                />
              ))
            )}
            {expiring.length > 5 && <ThemedText type="small" themeColor="textSecondary">+ {expiring.length - 5} more</ThemedText>}
          </TasteCard>

          {/* Running low */}
          <TasteCard taste="salty" emoji="🧂" title="Running low" actionLabel="Shopping" onAction={() => router.navigate('/shopping')}>
            {low.lowItems.length + low.ranOut.length === 0 ? (
              <ThemedText themeColor="textSecondary">Everything is stocked up.</ThemedText>
            ) : (
              <>
                {low.ranOut.slice(0, 4).map((e) => (
                  <Row key={e.id} emoji="🛒" name={e.name} detail="On your shopping list" badge="Ran out" tone={theme.danger} />
                ))}
                {low.lowItems.slice(0, 5).map((it) => (
                  <Row
                    key={it.id}
                    emoji={categoryEmoji(it.category)}
                    name={it.name}
                    detail={`Alert at ${it.lowThreshold} ${it.unit}`}
                    badge={`${it.quantity} ${it.unit} left`}
                    tone={theme.salty}
                  />
                ))}
              </>
            )}
          </TasteCard>

          {/* Recipe suggestion */}
          <TasteCard taste="sweet" emoji="🍳" title="Want to cook this today?">
            <RecipeCard analysis={current} usesTodayItem={false} onPress={() => setSelected(current.recipe)} />
            <ThemedText type="small" themeColor="textSecondary">
              {current.recipe.proteinPerServing} g protein covers {goalPct}% of your {settings.dailyProteinGoal} g goal
              {current.problems.length === 0 ? ' · you have everything' : ` · missing ${current.problems.length} ${current.problems.length === 1 ? 'item' : 'items'}`}
            </ThemedText>
            <Pressable onPress={() => setSuggestion((n) => n + 1)} style={styles.another}>
              <Ionicons name="shuffle" size={18} color={theme.sweet} />
              <ThemedText style={{ color: theme.sweet, fontWeight: '700' }}>Show another</ThemedText>
            </Pressable>
          </TasteCard>
        </ScrollView>
      </SafeAreaView>

      {selected && <RecipeDetail key={selected.id} recipe={selected} onClose={() => setSelected(null)} />}
      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.six, gap: Spacing.three },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingTop: Spacing.two },
  title: { fontSize: 26, fontWeight: '800', lineHeight: 32 },
  big: { fontSize: 18, fontWeight: '700' },
  webNote: { padding: Spacing.three, borderRadius: Radius.md },
  button: { alignItems: 'center', padding: 14, borderRadius: Radius.md, marginTop: Spacing.one },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.two + 2, borderRadius: Radius.md },
  rowEmoji: { fontSize: 22, lineHeight: 28 },
  rowName: { fontSize: 16, fontWeight: '700' },
  rowBadge: { fontSize: 13, fontWeight: '800' },
  another: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, alignSelf: 'flex-start', paddingVertical: Spacing.one },
});
