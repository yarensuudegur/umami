import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius } from '@/constants/theme';
import { parseISODate } from '@/features/pantry/status';
import { useTheme } from '@/hooks/use-theme';

import { DAY_NAMES, dateOfDay } from './plan';
import type { Week } from './types';

type Props = {
  week: Week;
  selected: number;
  todayIndex: number;
  completedDays: number[];
  onSelect: (index: number) => void;
};

export function DayStrip({ week, selected, todayIndex, completedDays, onSelect }: Props) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {week.days.map((day, i) => {
        const isSelected = i === selected;
        const done = completedDays.includes(i);
        const training = day.focus !== null;
        return (
          <Pressable
            key={i}
            onPress={() => onSelect(i)}
            accessibilityLabel={`${DAY_NAMES[i]}, ${done ? 'done' : training ? 'training' : 'rest'}`}
            style={[
              styles.cell,
              {
                backgroundColor: isSelected ? theme.accent : theme.backgroundElement,
                borderColor: i === todayIndex ? theme.accent : theme.border,
                borderWidth: i === todayIndex ? 2 : 1,
              },
            ]}>
            <ThemedText style={[styles.name, { color: isSelected ? theme.onAccent : theme.textSecondary }]}>{DAY_NAMES[i]}</ThemedText>
            <ThemedText style={[styles.date, { color: isSelected ? theme.onAccent : theme.text }]}>
              {parseISODate(dateOfDay(week.weekStart, i)).getDate()}
            </ThemedText>
            <Ionicons
              name={done ? 'checkmark-circle' : training ? 'barbell' : 'moon-outline'}
              size={16}
              color={isSelected ? theme.onAccent : done ? theme.accent : theme.textSecondary}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  cell: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 10, borderRadius: Radius.md },
  name: { fontSize: 11, fontWeight: '700', lineHeight: 14 },
  date: { fontSize: 16, fontWeight: '800', lineHeight: 20 },
});
