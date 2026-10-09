import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Chip } from '@/components/chip';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { LEVELS, type Level, type Profile } from './types';

const LEVEL_LABEL: Record<Level, string> = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
const LEVEL_HINT: Record<Level, string> = {
  beginner: 'New to training or coming back. 5 exercises, 3 sets.',
  intermediate: 'Training regularly. 6 exercises, harder variations.',
  advanced: 'Experienced. 7 exercises, 4 sets, longer holds.',
};

type Props = { initial?: Profile | null; submitLabel: string; onSubmit: (profile: Profile) => void };

/** Picks days per week and level. Mount it fresh (via `key`) to reset it. */
export function PlanSetup({ initial, submitLabel, onSubmit }: Props) {
  const theme = useTheme();
  const [days, setDays] = useState(initial?.daysPerWeek ?? 4);
  const [level, setLevel] = useState<Level>(initial?.level ?? 'beginner');

  return (
    <View style={styles.wrap}>
      <ThemedText type="smallBold" themeColor="textSecondary">TRAINING DAYS PER WEEK</ThemedText>
      <View style={styles.row}>
        {[2, 3, 4, 5, 6].map((d) => (
          <Chip key={d} label={String(d)} selected={d === days} onPress={() => setDays(d)} />
        ))}
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {7 - days} rest {7 - days === 1 ? 'day' : 'days'} each week.
      </ThemedText>

      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.gap}>YOUR LEVEL</ThemedText>
      <View style={styles.row}>
        {LEVELS.map((l) => (
          <Chip key={l} label={LEVEL_LABEL[l]} selected={l === level} onPress={() => setLevel(l)} />
        ))}
      </View>
      <ThemedText type="small" themeColor="textSecondary">{LEVEL_HINT[level]}</ThemedText>

      <Pressable
        onPress={() => onSubmit({ daysPerWeek: days, level })}
        style={({ pressed }) => [styles.button, { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 }]}>
        <ThemedText style={{ color: theme.onAccent, fontWeight: '700', fontSize: 16 }}>{submitLabel}</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.two },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  gap: { marginTop: Spacing.three },
  button: { alignItems: 'center', padding: Spacing.three, borderRadius: Radius.md, marginTop: Spacing.four },
});
