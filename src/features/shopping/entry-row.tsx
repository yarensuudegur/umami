import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { ShoppingEntry } from './types';

function subtitle(e: ShoppingEntry): string {
  if (e.kind === 'note') return 'Note';
  if (e.source === 'auto') return e.reason === 'out' ? 'Ran out' : 'Running low';
  if (e.source === 'recipe') return `For ${(e.forRecipes ?? []).join(', ')}`;
  return 'Added by you';
}

type Props = { entry: ShoppingEntry; onToggle: () => void; onRemove: () => void };

export function EntryRow({ entry, onToggle, onRemove }: Props) {
  const theme = useTheme();
  const tone = entry.source === 'auto' ? (entry.reason === 'out' ? theme.danger : theme.caution) : theme.textSecondary;

  return (
    <View style={[styles.row, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <Pressable onPress={onToggle} hitSlop={8} accessibilityLabel={entry.checked ? 'Uncheck' : 'Check'}>
        <Ionicons
          name={entry.checked ? 'checkmark-circle' : 'ellipse-outline'}
          size={28}
          color={entry.checked ? theme.accent : theme.textSecondary}
        />
      </Pressable>
      <View style={styles.body}>
        <ThemedText
          style={[styles.name, entry.checked && { textDecorationLine: 'line-through', color: theme.textSecondary }]}
          numberOfLines={3}>
          {entry.name}
        </ThemedText>
        <ThemedText type="small" style={{ color: tone }} numberOfLines={2}>
          {entry.kind === 'note' ? '📝 ' : ''}
          {subtitle(entry)}
        </ThemedText>
      </View>
      {entry.quantity !== undefined && entry.unit && (
        <ThemedText type="smallBold" themeColor="textSecondary">
          {entry.quantity} {entry.unit}
        </ThemedText>
      )}
      <Pressable onPress={onRemove} hitSlop={10} accessibilityLabel="Remove">
        <Ionicons name="trash-outline" size={20} color={theme.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  body: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: '600' },
});
