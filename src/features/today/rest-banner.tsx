import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// One cozy message per weekday (Mon = 0).
const MESSAGES: { emoji: string; line: string; tip: string }[] = [
  { emoji: '🦥', line: 'Sloth mode: activated.', tip: 'Muscles grow while you rest. Slow is productive today.' },
  { emoji: '🍵', line: 'Tea, stretch, repeat.', tip: 'Ten minutes of gentle stretching works wonders.' },
  { emoji: '🛋️', line: 'The couch called. It misses you.', tip: 'Sleep is the best supplement. Aim for 8 hours.' },
  { emoji: '🐱', line: 'Be a cat today: nap, stretch, nap.', tip: 'A light walk keeps the blood flowing.' },
  { emoji: '🌿', line: 'Recharging in progress…', tip: 'Drink plenty of water and enjoy a protein-rich meal.' },
  { emoji: '☁️', line: 'Floating through a rest day.', tip: 'Foam roll or take a warm shower to loosen up.' },
  { emoji: '🧸', line: 'Cozy Sunday. Nothing to lift but your mood.', tip: 'Prep your meals so the week starts easy.' },
];

export function RestBanner({ dayIndex }: { dayIndex: number }) {
  const theme = useTheme();
  const m = MESSAGES[dayIndex % MESSAGES.length];

  return (
    <View style={[styles.banner, { backgroundColor: theme.bitterSoft }]}>
      <View style={[styles.bubble, { backgroundColor: theme.background }]}>
        <ThemedText style={styles.emoji}>{m.emoji}</ThemedText>
      </View>
      <View style={styles.text}>
        <ThemedText style={[styles.title, { color: theme.bitter }]}>Rest day</ThemedText>
        <ThemedText style={styles.line}>{m.line}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">{m.tip}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three, borderRadius: Radius.lg },
  bubble: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 40, lineHeight: 52 },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 22, fontWeight: '800' },
  line: { fontSize: 15, fontWeight: '600' },
});
