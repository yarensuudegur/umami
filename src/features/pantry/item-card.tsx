import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { daysUntilExpiry, formatDate, isExpired, isExpiringSoon, isLow } from './status';
import { categoryEmoji, type PantryItem } from './types';

type Tone = 'danger' | 'warning' | 'caution';

function Badge({ label, tone }: { label: string; tone: Tone }) {
  const theme = useTheme();
  const bg = { danger: theme.dangerSoft, warning: theme.warningSoft, caution: theme.cautionSoft }[tone];
  const fg = { danger: theme.danger, warning: theme.warning, caution: theme.caution }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <ThemedText style={[styles.badgeText, { color: fg }]}>{label}</ThemedText>
    </View>
  );
}

function expiryLabel(days: number): string {
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  return `Expires in ${days} days`;
}

export function ItemCard({ item, onPress }: { item: PantryItem; onPress: () => void }) {
  const theme = useTheme();
  const days = daysUntilExpiry(item);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <View style={[styles.emoji, { backgroundColor: theme.accentSoft }]}>
        <ThemedText style={styles.emojiText}>{categoryEmoji(item.category)}</ThemedText>
      </View>
      <View style={styles.body}>
        <ThemedText style={styles.name} numberOfLines={1}>
          {item.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {item.category}
          {item.expiryDate && days !== null && days > 3 ? ` · Expires ${formatDate(item.expiryDate)}` : ''}
        </ThemedText>
        {(isExpired(item) || isExpiringSoon(item) || isLow(item)) && (
          <View style={styles.badges}>
            {isExpired(item) && <Badge label="Expired" tone="danger" />}
            {isExpiringSoon(item) && days !== null && <Badge label={expiryLabel(days)} tone="warning" />}
            {isLow(item) && <Badge label="Running low" tone="caution" />}
          </View>
        )}
      </View>
      <ThemedText style={styles.qty}>
        {item.quantity} {item.unit}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  emoji: { width: 48, height: 48, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  emojiText: { fontSize: 24, lineHeight: 30 },
  body: { flex: 1, gap: 2 },
  name: { fontSize: 17, fontWeight: '600' },
  qty: { fontSize: 16, fontWeight: '700' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.one },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.pill },
  badgeText: { fontSize: 12, fontWeight: '700', lineHeight: 16 },
});
