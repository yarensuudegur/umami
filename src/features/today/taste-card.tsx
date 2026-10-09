import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type Taste = 'sweet' | 'sour' | 'salty' | 'bitter' | 'umami';

type Props = {
  taste: Taste;
  title: string;
  emoji: string;
  /** Optional link in the card header, e.g. "See pantry". */
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
};

/** A dashboard card tinted with one of the five taste colors. */
export function TasteCard({ taste, title, emoji, actionLabel, onAction, children }: Props) {
  const theme = useTheme();
  const strong = theme[taste];
  const soft = theme[`${taste}Soft` as const];

  return (
    <View style={[styles.card, { backgroundColor: soft }]}>
      <View style={styles.header}>
        <ThemedText style={styles.emoji}>{emoji}</ThemedText>
        <ThemedText style={[styles.title, { color: strong }]}>{title}</ThemedText>
        {actionLabel && onAction && (
          <Pressable onPress={onAction} hitSlop={10} style={styles.action}>
            <ThemedText style={{ color: strong, fontWeight: '700', fontSize: 13 }}>{actionLabel}</ThemedText>
            <Ionicons name="chevron-forward" size={14} color={strong} />
          </Pressable>
        )}
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.two + 2 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  emoji: { fontSize: 20, lineHeight: 26 },
  title: { flex: 1, fontSize: 17, fontWeight: '800' },
  action: { flexDirection: 'row', alignItems: 'center' },
  body: { gap: Spacing.two },
});
