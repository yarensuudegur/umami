import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { FOCI, TODAY_CHOICES } from './plan';
import type { FocusId } from './types';

const EMOJI: Record<FocusId, string> = {
  back: '🦍', chest: '💪', shoulders: '🏋️', arms: '💥', legs: '🦵', core: '🔥', full: '⚡',
  upper: '', lower: '', push: '', pull: '',
};

type Props = { onPick: (focus: FocusId) => void; onClose: () => void };

export function TrainTodaySheet({ onPick, onClose }: Props) {
  const theme = useTheme();
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>What do you want to train today?</ThemedText>
          <Pressable onPress={onClose} hitSlop={12}>
            <ThemedText style={{ color: theme.accent, fontWeight: '700' }}>Cancel</ThemedText>
          </Pressable>
        </View>
        <ThemedText themeColor="textSecondary" style={styles.hint}>
          I will build today&apos;s session and rebalance the rest of your week around it, keeping the same muscles from
          being trained two days in a row.
        </ThemedText>
        <View style={styles.grid}>
          {TODAY_CHOICES.map((focus) => (
            <Pressable
              key={focus}
              onPress={() => onPick(focus)}
              style={({ pressed }) => [styles.choice, { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: pressed ? 0.8 : 1 }]}>
              <ThemedText style={styles.emoji}>{EMOJI[focus]}</ThemedText>
              <ThemedText style={styles.label}>{FOCI[focus].label}</ThemedText>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three, padding: Spacing.four },
  title: { flex: 1, fontSize: 20, fontWeight: '800' },
  hint: { paddingHorizontal: Spacing.four },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three, padding: Spacing.four },
  choice: { width: '47%', alignItems: 'center', gap: Spacing.one, paddingVertical: Spacing.four, borderRadius: Radius.md, borderWidth: 1 },
  emoji: { fontSize: 32, lineHeight: 40 },
  label: { fontSize: 16, fontWeight: '700' },
});
