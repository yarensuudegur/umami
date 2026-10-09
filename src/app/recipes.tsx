import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { usePantry } from '@/features/pantry/pantry-provider';
import type { PantryItem } from '@/features/pantry/types';
import { RECIPES } from '@/features/recipes/data';
import { RecipeFilters } from '@/features/recipes/filters';
import { analyzeRecipe, usesPantryItem, type RecipeAnalysis } from '@/features/recipes/matching';
import { RecipeCard } from '@/features/recipes/recipe-card';
import { RecipeDetail } from '@/features/recipes/recipe-detail';
import type { Recipe } from '@/features/recipes/types';
import { SettingsSheet } from '@/features/settings/settings-sheet';
import { useTheme } from '@/hooks/use-theme';

type Row =
  | { type: 'header'; key: string; title: string; subtitle: string }
  | { type: 'recipe'; key: string; analysis: RecipeAnalysis; usesToday: boolean }
  | { type: 'empty'; key: string; text: string };

export default function RecipesScreen() {
  const theme = useTheme();
  const { items } = usePantry();
  const [minProtein, setMinProtein] = useState<number | null>(null);
  const [maxCalories, setMaxCalories] = useState<number | null>(null);
  const [useToday, setUseToday] = useState<PantryItem | null>(null);
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);

  // The picked item may have been used up since; ignore it if it is no longer in the pantry.
  const pick = useToday && items.find((it) => it.id === useToday.id) ? useToday : null;

  const rows = useMemo<Row[]>(() => {
    const analyses = RECIPES.filter(
      (r) => (minProtein === null || r.proteinPerServing >= minProtein) && (maxCalories === null || r.caloriesPerServing <= maxCalories),
    ).map((r) => ({ analysis: analyzeRecipe(r, items), usesToday: pick ? usesPantryItem(r, pick) : false }));

    const rank = (a: (typeof analyses)[number], b: (typeof analyses)[number]) =>
      Number(b.usesToday) - Number(a.usesToday) ||
      b.analysis.expiringItems.length - a.analysis.expiringItems.length ||
      b.analysis.recipe.proteinPerServing - a.analysis.recipe.proteinPerServing;

    const ready = analyses.filter((a) => a.analysis.problems.length === 0).sort(rank);
    const almost = analyses.filter((a) => [1, 2].includes(a.analysis.problems.length)).sort(rank);
    const rest = analyses.filter((a) => a.analysis.problems.length > 2).sort(rank);

    const toRows = (list: typeof analyses): Row[] =>
      list.map((a) => ({ type: 'recipe', key: a.analysis.recipe.id, analysis: a.analysis, usesToday: a.usesToday }));

    const out: Row[] = [
      { type: 'header', key: 'h-ready', title: 'You have everything', subtitle: `${ready.length} ${ready.length === 1 ? 'recipe' : 'recipes'}` },
      ...(ready.length ? toRows(ready) : [{ type: 'empty', key: 'e-ready', text: 'Nothing fully covered by your pantry yet.' } as Row]),
      { type: 'header', key: 'h-almost', title: 'Missing 1–2 items', subtitle: `${almost.length} ${almost.length === 1 ? 'recipe' : 'recipes'}` },
      ...(almost.length ? toRows(almost) : [{ type: 'empty', key: 'e-almost', text: 'No recipes are just one or two items away.' } as Row]),
    ];
    if (rest.length) {
      out.push({ type: 'header', key: 'h-rest', title: 'Need more shopping', subtitle: `${rest.length} more ${rest.length === 1 ? 'recipe' : 'recipes'} missing 3+ items` });
      if (showMore) out.push(...toRows(rest));
    }
    return out;
  }, [items, minProtein, maxCalories, pick, showMore]);

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <FlatList
          data={rows}
          keyExtractor={(r) => r.key}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.top}>
              <View style={styles.titleRow}>
                <ThemedText style={styles.title}>Recipes</ThemedText>
                <Pressable onPress={() => setSettingsOpen(true)} hitSlop={12} accessibilityLabel="Settings">
                  <Ionicons name="settings-outline" size={26} color={theme.text} />
                </Pressable>
              </View>
              <ThemedText themeColor="textSecondary">{RECIPES.length} high-protein recipes matched to your pantry</ThemedText>
              <View style={{ height: Spacing.two }} />
              <RecipeFilters
                minProtein={minProtein}
                maxCalories={maxCalories}
                useToday={pick}
                pantry={items}
                onMinProtein={setMinProtein}
                onMaxCalories={setMaxCalories}
                onUseToday={setUseToday}
              />
            </View>
          }
          renderItem={({ item }) => {
            if (item.type === 'header') {
              const isRest = item.key === 'h-rest';
              return (
                <Pressable disabled={!isRest} onPress={() => setShowMore((v) => !v)} style={styles.sectionHeader}>
                  <View style={styles.flex}>
                    <ThemedText style={styles.sectionTitle}>{item.title}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">{item.subtitle}</ThemedText>
                  </View>
                  {isRest && <Ionicons name={showMore ? 'chevron-up' : 'chevron-down'} size={20} color={theme.textSecondary} />}
                </Pressable>
              );
            }
            if (item.type === 'empty') return <ThemedText themeColor="textSecondary">{item.text}</ThemedText>;
            return <RecipeCard analysis={item.analysis} usesTodayItem={item.usesToday} onPress={() => setSelected(item.analysis.recipe)} />;
          }}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.two + 2 }} />}
        />
      </SafeAreaView>

      {selected && <RecipeDetail key={selected.id} recipe={selected} onClose={() => setSelected(null)} />}
      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.six },
  top: { paddingTop: Spacing.three, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 34, fontWeight: '800', lineHeight: 40 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingTop: Spacing.four, paddingBottom: Spacing.one },
  sectionTitle: { fontSize: 22, fontWeight: '800' },
});
