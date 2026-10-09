import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { useSettings } from './settings-provider';

/** Mounted fresh on each open so the input starts from the saved goal. */
export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const theme = useTheme();
  const { settings, setDailyProteinGoal } = useSettings();
  const [goal, setGoal] = useState(String(settings.dailyProteinGoal));

  const save = () => {
    const value = Number(goal.replace(',', '.'));
    if (!Number.isFinite(value) || value < 10 || value > 400) {
      return Alert.alert('Invalid goal', 'Enter a daily protein goal between 10 and 400 g.');
    }
    setDailyProteinGoal(Math.round(value));
    onClose();
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12}>
            <ThemedText themeColor="textSecondary">Cancel</ThemedText>
          </Pressable>
          <ThemedText style={styles.title}>Settings</ThemedText>
          <Pressable onPress={save} hitSlop={12}>
            <ThemedText style={{ color: theme.accent, fontWeight: '700' }}>Save</ThemedText>
          </Pressable>
        </View>
        <View style={styles.content}>
          <ThemedText type="smallBold" themeColor="textSecondary">DAILY PROTEIN GOAL (g)</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundElement, borderColor: theme.border, color: theme.text }]}
            value={goal}
            onChangeText={setGoal}
            keyboardType="number-pad"
            placeholder="120"
            placeholderTextColor={theme.textSecondary}
          />
          <ThemedText type="small" themeColor="textSecondary">
            Recipes show how much of this goal one serving covers.
          </ThemedText>
        </View>
      </SafeAreaView>
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
  title: { fontSize: 17, fontWeight: '700' },
  content: { padding: Spacing.four, gap: Spacing.two },
  input: { borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.three, paddingVertical: 14, fontSize: 16 },
});
