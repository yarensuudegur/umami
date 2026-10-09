import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip } from '@/components/chip';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { ItemForm } from '@/features/pantry/item-form';
import { usePantry } from '@/features/pantry/pantry-provider';
import { normalizeName } from '@/features/recipes/matching';
import { EntryRow } from '@/features/shopping/entry-row';
import { useShopping } from '@/features/shopping/shopping-provider';
import type { ShoppingEntry } from '@/features/shopping/types';
import { useTheme } from '@/hooks/use-theme';

export default function ShoppingScreen() {
  const theme = useTheme();
  const { entries, addManual, setChecked, remove, clearChecked } = useShopping();
  const { items, restock } = usePantry();
  const [text, setText] = useState('');
  const [kind, setKind] = useState<'item' | 'note'>('item');
  const [buying, setBuying] = useState<ShoppingEntry | null>(null);
  const [showDone, setShowDone] = useState(true);

  const todo = entries.filter((e) => !e.checked);
  const done = entries.filter((e) => e.checked);

  const add = () => {
    if (!text.trim()) return;
    addManual(text, kind);
    setText('');
  };

  const toggle = (entry: ShoppingEntry) => {
    // Ticking an item asks how much was bought; notes and un-ticking never touch the pantry.
    if (!entry.checked && entry.kind === 'item') setBuying(entry);
    else setChecked(entry.id, !entry.checked);
  };

  const existing = buying ? items.find((it) => normalizeName(it.name) === normalizeName(buying.name)) : undefined;

  const rows: ({ type: 'entry'; entry: ShoppingEntry } | { type: 'done-header' })[] = [
    ...todo.map((entry) => ({ type: 'entry' as const, entry })),
    ...(done.length ? [{ type: 'done-header' as const }] : []),
    ...(showDone ? done.map((entry) => ({ type: 'entry' as const, entry })) : []),
  ];

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <FlatList
          data={rows}
          keyExtractor={(r) => (r.type === 'entry' ? r.entry.id : 'done-header')}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.two }} />}
          ListHeaderComponent={
            <View style={styles.top}>
              <ThemedText style={styles.title}>Shopping</ThemedText>
              <ThemedText themeColor="textSecondary">
                {todo.length === 0 ? 'Nothing to buy' : `${todo.length} to buy`}
              </ThemedText>

              <View style={styles.addRow}>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundElement, borderColor: theme.border, color: theme.text }]}
                  value={text}
                  onChangeText={setText}
                  placeholder={kind === 'item' ? 'Add an item' : 'Write a note'}
                  placeholderTextColor={theme.textSecondary}
                  onSubmitEditing={add}
                  returnKeyType="done"
                />
                <Pressable
                  onPress={add}
                  accessibilityLabel="Add to list"
                  style={[styles.addBtn, { backgroundColor: theme.accent, opacity: text.trim() ? 1 : 0.5 }]}>
                  <Ionicons name="add" size={26} color={theme.onAccent} />
                </Pressable>
              </View>
              <View style={styles.kindRow}>
                <Chip label="Item" selected={kind === 'item'} onPress={() => setKind('item')} />
                <Chip label="Note" selected={kind === 'note'} onPress={() => setKind('note')} />
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <ThemedText style={styles.emptyEmoji}>🛒</ThemedText>
              <ThemedText style={styles.emptyTitle}>Your list is empty</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.center}>
                Items that run out or get low in your pantry show up here automatically.
              </ThemedText>
            </View>
          }
          renderItem={({ item }) =>
            item.type === 'done-header' ? (
              <View style={styles.doneHeader}>
                <Pressable style={styles.doneToggle} onPress={() => setShowDone((v) => !v)}>
                  <ThemedText style={styles.doneTitle}>Done ({done.length})</ThemedText>
                  <Ionicons name={showDone ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textSecondary} />
                </Pressable>
                <Pressable onPress={clearChecked} hitSlop={10}>
                  <ThemedText style={{ color: theme.accent, fontWeight: '700' }}>Clear done</ThemedText>
                </Pressable>
              </View>
            ) : (
              <EntryRow entry={item.entry} onToggle={() => toggle(item.entry)} onRemove={() => remove(item.entry.id)} />
            )
          }
        />
      </SafeAreaView>

      {buying && (
        <ItemForm
          key={buying.id}
          visible
          item={null}
          title="How much did you buy?"
          initial={{
            name: buying.name,
            unit: buying.unit ?? existing?.unit,
            category: buying.category ?? existing?.category,
            quantity: buying.quantity,
            lowThreshold: existing?.lowThreshold,
          }}
          onClose={() => setBuying(null)}
          onSave={(data) => {
            restock(data);
            setChecked(buying.id, true);
            setBuying(null);
          }}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.six },
  top: { paddingTop: Spacing.three, paddingBottom: Spacing.three, gap: Spacing.two },
  title: { fontSize: 34, fontWeight: '800', lineHeight: 40 },
  addRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
  input: { flex: 1, borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.three, paddingVertical: 12, fontSize: 16 },
  addBtn: { width: 50, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  kindRow: { flexDirection: 'row', gap: Spacing.two },
  empty: { alignItems: 'center', gap: Spacing.two, paddingTop: Spacing.five, paddingHorizontal: Spacing.four },
  emptyEmoji: { fontSize: 56, lineHeight: 70 },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  center: { textAlign: 'center' },
  doneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.three },
  doneToggle: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  doneTitle: { fontSize: 18, fontWeight: '700' },
});
