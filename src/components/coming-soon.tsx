import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = { title: string; icon: React.ComponentProps<typeof Ionicons>['name'] };

export function ComingSoon({ title, icon }: Props) {
  const theme = useTheme();
  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.center} edges={['top']}>
        <View style={[styles.badge, { backgroundColor: theme.accentSoft }]}>
          <Ionicons name={icon} size={36} color={theme.accent} />
        </View>
        <ThemedText style={styles.title}>{title}</ThemedText>
        <ThemedText themeColor="textSecondary">Coming soon</ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  badge: {
    width: 80,
    height: 80,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  title: { fontSize: 24, fontWeight: '700' },
});
