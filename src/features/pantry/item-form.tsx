import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { parseISODate, toISODate } from './status';
import { CATEGORIES, UNITS, type Category, type PantryItem, type Unit } from './types';

type Props = {
  visible: boolean;
  item: PantryItem | null; // null = creating
  onClose: () => void;
  onSave: (data: Omit<PantryItem, 'id'>) => void;
  onDelete?: () => void;
};

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.accent : theme.backgroundElement,
          borderColor: selected ? theme.accent : theme.border,
        },
      ]}>
      <ThemedText style={[styles.chipText, { color: selected ? theme.onAccent : theme.text }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function ItemForm({ visible, item, onClose, onSave, onDelete }: Props) {
  const theme = useTheme();
  // The parent mounts this component fresh (via `key`) for each open, so initial state is enough.
  const [name, setName] = useState(item?.name ?? '');
  const [quantity, setQuantity] = useState(item ? String(item.quantity) : '');
  const [unit, setUnit] = useState<Unit>(item?.unit ?? 'pcs');
  const [category, setCategory] = useState<Category>(item?.category ?? 'Other');
  const [expiry, setExpiry] = useState<string | undefined>(item?.expiryDate);
  const [threshold, setThreshold] = useState(item ? String(item.lowThreshold) : '');
  const [showPicker, setShowPicker] = useState(false);

  const parseNum = (s: string) => Number(s.replace(',', '.'));

  const submit = () => {
    const qty = parseNum(quantity);
    const low = threshold.trim() === '' ? 0 : parseNum(threshold);
    if (!name.trim()) return Alert.alert('Name required', 'Please enter a name for this item.');
    if (quantity.trim() === '' || !Number.isFinite(qty) || qty < 0)
      return Alert.alert('Invalid quantity', 'Enter a number of 0 or more.');
    if (!Number.isFinite(low) || low < 0)
      return Alert.alert('Invalid threshold', 'Enter a number of 0 or more, or leave it empty.');
    onSave({ name: name.trim(), quantity: qty, unit, category, expiryDate: expiry, lowThreshold: low });
  };

  const onDateChange = (e: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (e.type === 'set' && date) setExpiry(toISODate(date));
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: theme.backgroundElement, borderColor: theme.border, color: theme.text },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.flex, { backgroundColor: theme.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={12}>
              <ThemedText style={{ color: theme.textSecondary }}>Cancel</ThemedText>
            </Pressable>
            <ThemedText style={styles.headerTitle}>{item ? 'Edit item' : 'New item'}</ThemedText>
            <Pressable onPress={submit} hitSlop={12}>
              <ThemedText style={{ color: theme.accent, fontWeight: '700' }}>Save</ThemedText>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <ThemedText type="smallBold" themeColor="textSecondary">NAME</ThemedText>
            <TextInput
              style={inputStyle}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Basmati rice"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="sentences"
            />

            <ThemedText type="smallBold" themeColor="textSecondary">QUANTITY</ThemedText>
            <TextInput
              style={inputStyle}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
            />
            <View style={styles.chips}>
              {UNITS.map((u) => (
                <Chip key={u} label={u} selected={u === unit} onPress={() => setUnit(u)} />
              ))}
            </View>

            <ThemedText type="smallBold" themeColor="textSecondary">CATEGORY</ThemedText>
            <View style={styles.chips}>
              {CATEGORIES.map((c) => (
                <Chip
                  key={c.name}
                  label={`${c.emoji} ${c.name}`}
                  selected={c.name === category}
                  onPress={() => setCategory(c.name)}
                />
              ))}
            </View>

            <ThemedText type="smallBold" themeColor="textSecondary">EXPIRY DATE</ThemedText>
            <View style={styles.dateRow}>
              <Pressable style={[inputStyle, styles.dateButton]} onPress={() => setShowPicker((v) => !v)}>
                <Ionicons name="calendar-outline" size={20} color={theme.accent} />
                <ThemedText style={{ color: expiry ? theme.text : theme.textSecondary }}>
                  {expiry ?? 'No expiry date'}
                </ThemedText>
              </Pressable>
              {expiry && (
                <Pressable onPress={() => setExpiry(undefined)} hitSlop={12}>
                  <Ionicons name="close-circle" size={24} color={theme.textSecondary} />
                </Pressable>
              )}
            </View>
            {showPicker && (
              <DateTimePicker
                value={expiry ? parseISODate(expiry) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={onDateChange}
                accentColor={theme.accent}
              />
            )}

            <ThemedText type="smallBold" themeColor="textSecondary">RUNNING LOW AT OR BELOW</ThemedText>
            <TextInput
              style={inputStyle}
              value={threshold}
              onChangeText={setThreshold}
              placeholder={`0 = no warning (in ${unit})`}
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
            />

            {item && onDelete && (
              <Pressable
                style={[styles.delete, { backgroundColor: theme.dangerSoft }]}
                onPress={() =>
                  Alert.alert('Delete item', `Remove "${item.name}" from your pantry?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: onDelete },
                  ])
                }>
                <Ionicons name="trash-outline" size={20} color={theme.danger} />
                <ThemedText style={{ color: theme.danger, fontWeight: '700' }}>Delete item</ThemedText>
              </Pressable>
            )}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  content: { padding: Spacing.four, paddingTop: Spacing.two, gap: Spacing.two, paddingBottom: Spacing.six },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: Spacing.two,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginBottom: Spacing.three },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.pill, borderWidth: 1 },
  chipText: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dateButton: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  delete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.md,
    marginTop: Spacing.four,
  },
});
