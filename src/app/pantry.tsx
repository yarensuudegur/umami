import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ItemCard } from '@/features/pantry/item-card';
import { ItemForm } from '@/features/pantry/item-form';
import { isExpired, isExpiringSoon, isLow, urgency } from '@/features/pantry/status';
import { CATEGORIES, type Category, type PantryItem } from '@/features/pantry/types';
import { usePantry } from '@/features/pantry/use-pantry';

export default function PantryScreen() {
  const theme = useTheme();
  const { items, addItem, updateItem, removeItem } = usePantry();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Category | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PantryItem | null>(null);

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((it) => (!filter || it.category === filter) && (!q || it.name.toLowerCase().includes(q)))
      .sort((a, b) => urgency(a) - urgency(b) || a.name.localeCompare(b.name));
  }, [items, query, filter]);

  const expiringCount = items.filter((it) => isExpired(it) || isExpiringSoon(it)).length;
  const lowCount = items.filter(isLow).length;

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (item: PantryItem) => {
    setEditing(item);
    setFormOpen(true);
  };
  const close = () => setFormOpen(false);

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <FlatList
          data={visibleItems}
          keyExtractor={(it) => it.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={{ height: Spacing.two + 2 }} />}
          renderItem={({ item }) => <ItemCard item={item} onPress={() => openEdit(item)} />}
          ListHeaderComponent={
            <View style={styles.header}>
              <ThemedText style={styles.title}>Pantry</ThemedText>
              <ThemedText themeColor="textSecondary">
                {items.length} {items.length === 1 ? 'item' : 'items'}
                {expiringCount > 0 ? ` Â· ${expiringCount} expiring` : ''}
                {lowCount > 0 ? ` Â· ${lowCount} running low` : ''}
              </ThemedText>

              <View
                style={[styles.search, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <Ionicons name="search" size={18} color={theme.textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: theme.text }]}
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search pantry"
                  placeholderTextColor={theme.textSecondary}
                  returnKeyType="search"
                />
                {query.length > 0 && (
                  <Pressable onPress={() => setQuery('')} hitSlop={10}>
                    <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                  </Pressable>
                )}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
                {[{ name: null as Category | null, emoji: '' }, ...CATEGORIES].map((c) => {
                  const selected = c.name === filter;
                  return (
                    <Pressable
                      key={c.name ?? 'all'}
                      onPress={() => setFilter(c.name)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: selected ? theme.accent : theme.backgroundElement,
                          borderColor: selected ? theme.accent : theme.border,
                        },
                      ]}>
                      <ThemedText style={[styles.chipText, { color: selected ? theme.onAccent : theme.text }]}>
                        {c.name ? `${c.emoji} ${c.name}` : 'All'}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <ThemedText style={styles.emptyEmoji}>ğŸ§º</ThemedText>
              <ThemedText style={styles.emptyTitle}>
                {items.length === 0 ? 'Your pantry is empty' : 'No matching items'}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.center}>
                {items.length === 0
                  ? 'Tap the + button to add your first ingredient.'
                  : 'Try a different search or category.'}
              </ThemedText>
            </View>
          }
        />

        <Pressable
          onPress={openNew}
          accessibilityLabel="Add item"
          style={({ pressed }) => [styles.fab, { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 }]}>
          <Ionicons name="add" size={30} color={theme.onAccent} />
        </Pressable>
      </SafeAreaView>

      {formOpen && (
        <ItemForm
          key={editing?.id ?? 'new'}
          visible
          item={editing}
          onClose={close}
          onSave={(data) => {
            if (editing) updateItem(editing.id, data);
            else addItem(data);
            close();
          }}
          onDelete={
            editing
              ? () => {
                  removeItem(editing.id);
                  close();
                }
              : undefined
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { paddingHorizontal: Spacing.three, paddingBottom: 120 },
  header: { gap: Spacing.two, paddingTop: Spacing.three, paddingBottom: Spacing.three },
  title: { fontSize: 34, fontWeight: '800', lineHeight: 40 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.two,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16 },
  filters: { gap: Spacing.two, paddingVertical: Spacing.one },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.pill, borderWidth: 1 },
  chipText: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  empty: { alignItems: 'center', gap: Spacing.two, paddingTop: Spacing.six, paddingHorizontal: Spacing.four },
  emptyEmoji: { fontSize: 56, lineHeight: 70 },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  center: { textAlign: 'center' },
  fab: {
    position: 'absolute',
    right: Spacing.four,
    bottom: Spacing.four,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
