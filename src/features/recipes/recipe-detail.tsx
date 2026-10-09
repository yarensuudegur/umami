import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { usePantry } from '@/features/pantry/pantry-provider';
import { useSettings } from '@/features/settings/settings-provider';
import { useShopping } from '@/features/shopping/shopping-provider';
import { useTheme } from '@/hooks/use-theme';

import { planCooking } from './cook';
import { analyzeRecipe, formatAmount, missingToShop } from './matching';
import type { Recipe } from './types';

/** Mounted fresh per recipe (via `key`) so the servings stepper starts at the recipe default. */
export function RecipeDetail({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const theme = useTheme();
  const { items, applyQuantities } = usePantry();
  const { settings } = useSettings();
  const [servings, setServings] = useState(recipe.servings);

  const { addMissing, isOnList } = useShopping();

  const analysis = useMemo(() => analyzeRecipe(recipe, items, servings), [recipe, items, servings]);
  const onList = isOnList(analysis.problems.map((p) => p.ingredient.name));
  const goalPct = Math.round((recipe.proteinPerServing / settings.dailyProteinGoal) * 100);

  const cook = () => {
    const plan = planCooking(recipe, servings, items);
    if (plan.lines.length === 0) {
      return Alert.alert('Nothing to remove', 'None of the ingredients for this recipe were found in your pantry.');
    }
    const skipped = plan.skipped.length ? `\n\nNot in pantry (skipped): ${plan.skipped.join(', ')}` : '';
    Alert.alert(`Cook ${servings} ${servings === 1 ? 'serving' : 'servings'}?`, `This will update your pantry:\n\n${plan.lines.join('\n')}${skipped}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'I cooked this',
        onPress: () => {
          applyQuantities(plan.quantities);
          onClose();
        },
      },
    ]);
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12}>
            <ThemedText style={{ color: theme.accent, fontWeight: '700' }}>Close</ThemedText>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText style={styles.emoji}>{recipe.emoji}</ThemedText>
          <ThemedText style={styles.title}>{recipe.name}</ThemedText>
          <ThemedText themeColor="textSecondary">{recipe.cuisine} · {recipe.timeMinutes} min</ThemedText>

          <View style={styles.stats}>
            <View style={[styles.stat, { backgroundColor: theme.accentSoft }]}>
              <ThemedText style={[styles.statValue, { color: theme.accent }]}>{recipe.proteinPerServing} g</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">protein / serving</ThemedText>
            </View>
            <View style={[styles.stat, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText style={styles.statValue}>{recipe.caloriesPerServing}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">kcal / serving</ThemedText>
            </View>
            <View style={[styles.stat, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText style={styles.statValue}>{goalPct}%</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">of {settings.dailyProteinGoal} g goal</ThemedText>
            </View>
          </View>

          <View style={styles.servingsRow}>
            <ThemedText style={styles.section}>Servings</ThemedText>
            <View style={styles.stepper}>
              <Pressable
                onPress={() => setServings((s) => Math.max(1, s - 1))}
                style={[styles.stepBtn, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
                accessibilityLabel="Fewer servings">
                <Ionicons name="remove" size={20} color={theme.text} />
              </Pressable>
              <ThemedText style={styles.servings}>{servings}</ThemedText>
              <Pressable
                onPress={() => setServings((s) => Math.min(12, s + 1))}
                style={[styles.stepBtn, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
                accessibilityLabel="More servings">
                <Ionicons name="add" size={20} color={theme.text} />
              </Pressable>
            </View>
          </View>

          <ThemedText style={styles.section}>Ingredients</ThemedText>
          <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            {analysis.statuses.map((s) => {
              const icon =
                s.status === 'have' ? { name: 'checkmark-circle', color: theme.accent } as const
                : s.status === 'staple' ? { name: 'home-outline', color: theme.textSecondary } as const
                : s.status === 'short' ? { name: 'alert-circle', color: theme.caution } as const
                : { name: 'close-circle', color: theme.danger } as const;
              return (
                <View key={s.ingredient.name} style={styles.ingRow}>
                  <Ionicons name={icon.name} size={20} color={icon.color} />
                  <ThemedText style={styles.ingName}>{s.ingredient.name}</ThemedText>
                  <View style={styles.ingRight}>
                    <ThemedText>{formatAmount(s.needed, s.ingredient.unit)}</ThemedText>
                    {s.status === 'short' && s.shortBy !== undefined && (
                      <ThemedText type="small" style={{ color: theme.caution }}>
                        short by {formatAmount(s.shortBy, s.ingredient.unit)}
                      </ThemedText>
                    )}
                    {s.status === 'missing' && <ThemedText type="small" style={{ color: theme.danger }}>missing</ThemedText>}
                  </View>
                </View>
              );
            })}
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            Basics like salt, oil, water and common spices are assumed to be at home.
          </ThemedText>

          <ThemedText style={styles.section}>Steps</ThemedText>
          {recipe.steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepNum, { backgroundColor: theme.accentSoft }]}>
                <ThemedText style={{ color: theme.accent, fontWeight: '700' }}>{i + 1}</ThemedText>
              </View>
              <ThemedText style={styles.stepText}>{step}</ThemedText>
            </View>
          ))}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
          {analysis.problems.length > 0 && (
            <Pressable
              onPress={() => addMissing(missingToShop(analysis.problems), recipe.name)}
              disabled={onList}
              style={[styles.addMissing, { borderColor: theme.accent, backgroundColor: onList ? theme.accentSoft : 'transparent' }]}>
              <Ionicons name={onList ? 'checkmark-circle' : 'cart-outline'} size={20} color={theme.accent} />
              <ThemedText style={{ color: theme.accent, fontWeight: '700' }}>
                {onList ? 'On your shopping list' : `Add ${analysis.problems.length} missing to shopping list`}
              </ThemedText>
            </Pressable>
          )}
          <Pressable onPress={cook} style={({ pressed }) => [styles.cook, { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 }]}>
            <Ionicons name="flame" size={20} color={theme.onAccent} />
            <ThemedText style={{ color: theme.onAccent, fontWeight: '700', fontSize: 16 }}>I cooked this</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { alignItems: 'flex-end', paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
  content: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.five, gap: Spacing.two },
  emoji: { fontSize: 56, lineHeight: 70 },
  title: { fontSize: 28, fontWeight: '800', lineHeight: 34 },
  stats: { flexDirection: 'row', gap: Spacing.two, marginVertical: Spacing.three },
  stat: { flex: 1, padding: Spacing.three, borderRadius: Radius.md, gap: 2 },
  statValue: { fontSize: 20, fontWeight: '800' },
  servingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.two },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  stepBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  servings: { fontSize: 20, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  section: { fontSize: 20, fontWeight: '700', marginTop: Spacing.three },
  card: { borderRadius: Radius.md, borderWidth: 1, padding: Spacing.three, gap: Spacing.three },
  ingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  ingName: { flex: 1, textTransform: 'capitalize' },
  ingRight: { alignItems: 'flex-end' },
  stepRow: { flexDirection: 'row', gap: Spacing.three, alignItems: 'flex-start' },
  stepNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepText: { flex: 1 },
  footer: { padding: Spacing.three, gap: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth },
  addMissing: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center', justifyContent: 'center', padding: Spacing.three, borderRadius: Radius.md, borderWidth: 1.5 },
  cook: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center', justifyContent: 'center', padding: Spacing.three, borderRadius: Radius.md },
});
