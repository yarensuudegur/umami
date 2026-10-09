import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip } from '@/components/chip';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { categoryEmoji, type PantryItem } from '@/features/pantry/types';
import { useTheme } from '@/hooks/use-theme';

export const MIN_PROTEIN_OPTIONS = [null, 20, 30, 40] as const;
export const MAX_CALORIE_OPTIONS = [null, 400, 500, 600, 700] as const;

type Props = {
  minProtein: number | null;
  maxCalories: number | null;
  useToday: PantryItem | null;
  pantry: PantryItem[];
  onMinProtein: (v: number | null) => void;
  onMaxCalories: (v: number | null) => void;
  onUseToday: (item: PantryItem | null) => void;
};

export function RecipeFilters({ minProtein, maxCalories, useToday, pantry, onMinProtein, onMaxCalories, onUseToday }: Props) {
  const theme = useTheme();
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      <ThemedText type="smallBold" themeColor="textSecondary">MIN PROTEIN</ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {MIN_PROTEIN_OPTIONS.map((v) => (
          <Chip key={String(v)} label={v === null ? 'Any' : `${v} g+`} selected={v === minProtein} onPress={() => onMinProtein(v)} />
        ))}
      </ScrollView>

      <ThemedText type="smallBold" themeColor="textSecondary">MAX CALORIES</ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {MAX_CALORIE_OPTIONS.map((v) => (
          <Chip key={String(v)} label={v === null ? 'Any' : `≤ ${v} kcal`} selected={v === maxCalories} onPress={() => onMaxCalories(v)} />
        ))}
      </ScrollView>

      <Pressable
        onPress={() => setPickerOpen(true)}
        style={[styles.today, { backgroundColor: useToday ? theme.accentSoft : theme.backgroundElement, borderColor: useToday ? theme.accent : theme.border }]}>
        <Ionicons name="restaurant-outline" size={18} color={theme.accent} />
        <ThemedText style={styles.todayText} numberOfLines={1}>
          {useToday ? `Using today: ${useToday.name}` : 'I want to use this today…'}
        </ThemedText>
        {useToday ? (
          <Pressable onPress={() => onUseToday(null)} hitSlop={10} accessibilityLabel="Clear item">
            <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
          </Pressable>
        ) : (
          <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
        )}
      </Pressable>

      {pickerOpen && (
        <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPickerOpen(false)}>
          <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
            <View style={styles.pickerHeader}>
              <ThemedText style={styles.pickerTitle}>Pick an item to use today</ThemedText>
              <Pressable onPress={() => setPickerOpen(false)} hitSlop={12}>
                <ThemedText style={{ color: theme.accent, fontWeight: '700' }}>Close</ThemedText>
              </Pressable>
            </View>
            <FlatList
              data={pantry}
              keyExtractor={(it) => it.id}
              contentContainerStyle={{ padding: Spacing.three, gap: Spacing.two }}
              ListEmptyComponent={
                <ThemedText themeColor="textSecondary" style={{ textAlign: 'center', marginTop: Spacing.five }}>
                  Your pantry is empty. Add items on the Pantry tab first.
                </ThemedText>
              }
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onUseToday(item);
                    setPickerOpen(false);
                  }}
                  style={[styles.pickRow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                  <ThemedText style={{ fontSize: 22 }}>{categoryEmoji(item.category)}</ThemedText>
                  <ThemedText style={styles.pickName}>{item.name}</ThemedText>
                  <ThemedText themeColor="textSecondary">{item.quantity} {item.unit}</ThemedText>
                </Pressable>
              )}
            />
          </SafeAreaView>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wrap: { gap: Spacing.one + 2 },
  row: { gap: Spacing.two, paddingBottom: Spacing.one },
  today: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    marginTop: Spacing.one,
  },
  todayText: { flex: 1, fontSize: 15, fontWeight: '600' },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.four },
  pickerTitle: { fontSize: 17, fontWeight: '700' },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three, borderRadius: Radius.md, borderWidth: 1 },
  pickName: { flex: 1, fontSize: 16, fontWeight: '600' },
});
