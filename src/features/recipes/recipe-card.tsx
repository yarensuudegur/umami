import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { RecipeAnalysis } from './matching';

type Props = { analysis: RecipeAnalysis; usesTodayItem: boolean; onPress: () => void };

export function RecipeCard({ analysis, usesTodayItem, onPress }: Props) {
  const theme = useTheme();
  const { recipe, problems, expiringItems } = analysis;
  const highlight = expiringItems.length > 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: highlight ? theme.warning : theme.border,
          borderWidth: highlight ? 1.5 : StyleSheet.hairlineWidth,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <View style={[styles.emoji, { backgroundColor: theme.accentSoft }]}>
        <ThemedText style={styles.emojiText}>{recipe.emoji}</ThemedText>
      </View>
      <View style={styles.body}>
        <ThemedText style={styles.name} numberOfLines={2}>{recipe.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {recipe.cuisine} · {recipe.timeMinutes} min · {recipe.servings} servings
        </ThemedText>
        <View style={styles.pills}>
          <View style={[styles.pill, { backgroundColor: theme.accentSoft }]}>
            <ThemedText style={[styles.pillText, { color: theme.accent }]}>{recipe.proteinPerServing} g protein</ThemedText>
          </View>
          <View style={[styles.pill, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText style={styles.pillText}>{recipe.caloriesPerServing} kcal</ThemedText>
          </View>
        </View>
        {highlight && (
          <View style={[styles.pill, styles.flag, { backgroundColor: theme.warningSoft }]}>
            <ThemedText style={[styles.pillText, { color: theme.warning }]} numberOfLines={1}>
              ⏰ Uses expiring: {expiringItems.join(', ')}
            </ThemedText>
          </View>
        )}
        {usesTodayItem && (
          <View style={[styles.pill, styles.flag, { backgroundColor: theme.accentSoft }]}>
            <ThemedText style={[styles.pillText, { color: theme.accent }]}>Uses your pick</ThemedText>
          </View>
        )}
        {problems.length > 0 && (
          <ThemedText type="small" style={{ color: theme.danger }} numberOfLines={2}>
            Missing: {problems.map((p) => (p.status === 'short' ? `${p.ingredient.name} (not enough)` : p.ingredient.name)).join(', ')}
          </ThemedText>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: Spacing.three, padding: Spacing.three, borderRadius: Radius.md },
  emoji: { width: 52, height: 52, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  emojiText: { fontSize: 26, lineHeight: 32 },
  body: { flex: 1, gap: 4 },
  name: { fontSize: 17, fontWeight: '700' },
  pills: { flexDirection: 'row', gap: Spacing.two, marginTop: 2 },
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.pill, alignSelf: 'flex-start' },
  flag: { marginTop: 2 },
  pillText: { fontSize: 12, fontWeight: '700', lineHeight: 16 },
});
