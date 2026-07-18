import { StyleSheet, Text, View } from 'react-native';

import { KPSS_TOPICS, LGS_TOPICS, YGS_TOPICS } from '@/src/data';
import { colors, space } from '@/src/theme';

export default function ProfileScreen() {
  const topicCount = LGS_TOPICS.length + YGS_TOPICS.length + KPSS_TOPICS.length;

  return (
    <View style={styles.container} testID="profile-screen">
      <Text style={styles.title}>Profil</Text>
      <Text style={styles.meta}>Sınav: — (LGS / YGS / KPSS)</Text>
      <Text style={styles.meta}>Günlük hak: 5</Text>
      <Text style={styles.meta} testID="topic-catalog-count">
        Konu kataloğu: {topicCount} başlık
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: space.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: space.md,
  },
  meta: {
    color: colors.textSecondary,
    marginBottom: space.sm,
  },
});
