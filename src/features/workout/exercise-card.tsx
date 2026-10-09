import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { getExercise } from './exercises';
import { EXERCISE_IMAGES } from './images';
import type { PlannedExercise } from './types';

type Props = {
  planned: PlannedExercise;
  done: boolean;
  /** Only today's exercises can be ticked. */
  interactive: boolean;
  onToggle: () => void;
};

export function ExerciseCard({ planned, done, interactive, onToggle }: Props) {
  const theme = useTheme();
  const exercise = getExercise(planned.id);
  if (!exercise) return null;

  const amount = planned.seconds ? `${planned.sets} × ${planned.seconds} s` : `${planned.sets} × ${planned.reps}`;

  return (
    <Pressable
      onPress={interactive ? onToggle : undefined}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done, disabled: !interactive }}
      style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: done ? theme.accent : theme.border, opacity: done ? 0.75 : 1 }]}>
      <Image
        source={EXERCISE_IMAGES[exercise.id]}
        style={[styles.image, { backgroundColor: theme.backgroundSelected }]}
        contentFit="cover"
        accessibilityLabel={exercise.name}
      />
      <View style={styles.body}>
        <ThemedText style={[styles.name, done && styles.struck]} numberOfLines={2}>{exercise.name}</ThemedText>
        <View style={[styles.pill, { backgroundColor: theme.accentSoft }]}>
          <ThemedText style={[styles.pillText, { color: theme.accent }]}>{amount}</ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary">{exercise.description}</ThemedText>
      </View>
      {interactive && (
        <Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={28} color={done ? theme.accent : theme.textSecondary} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.two + 2, borderRadius: Radius.md, borderWidth: 1 },
  image: { width: 96, height: 72, borderRadius: Radius.sm },
  body: { flex: 1, gap: 4 },
  name: { fontSize: 16, fontWeight: '700' },
  struck: { textDecorationLine: 'line-through' },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 2, borderRadius: Radius.pill },
  pillText: { fontSize: 12, fontWeight: '800', lineHeight: 18 },
});
