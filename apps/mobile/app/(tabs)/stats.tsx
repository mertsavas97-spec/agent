import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { fetchProgressSummary } from '@/src/lib/api/progressClient';
import type { ProgressSummary } from '@/src/lib/api/types';
import { colors, radii, shadows, space, typography } from '@/src/theme';
import { EmptyState } from '@/src/ui/EmptyState';

export default function StatsScreen() {
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void (async () => {
        setLoading(true);
        try {
          const data = await fetchProgressSummary();
          if (alive) setSummary(data);
        } catch {
          if (alive) setSummary(null);
        } finally {
          if (alive) setLoading(false);
        }
      })();
      return () => {
        alive = false;
      };
    }, []),
  );

  const maxAttempts = Math.max(1, ...(summary?.topics.map((t) => t.attemptCount) ?? [1]));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="stats-screen">
      <Text style={styles.eyebrow}>İlerleme</Text>
      <Text style={styles.title}>İstatistik</Text>
      <Text style={styles.subtitle}>Konu bazlı deneme ve seri özeti.</Text>

      {loading ? (
        <ActivityIndicator color={colors.navy} />
      ) : !summary || summary.topics.length === 0 ? (
        <EmptyState
          title="İlerleme verisi henüz yok"
          subtitle="Birkaç soru çözdükten sonra burası dolacak."
        />
      ) : (
        <>
          <Text style={styles.streak} testID="stats-streak">
            Seri: {summary.streakCount} gün
          </Text>

          {summary.weakestTopic ? (
            <View style={styles.weakCard} testID="weakest-topic">
              <Text style={styles.weakLabel}>Zayıf alan</Text>
              <Text style={styles.weakName}>{summary.weakestTopic.nameTr}</Text>
              <Text style={styles.weakMeta}>
                Anlamadım: {summary.weakestTopic.followUpCount} · Deneme:{' '}
                {summary.weakestTopic.attemptCount}
              </Text>
            </View>
          ) : null}

          <Text style={styles.section}>Konular</Text>
          {summary.topics.map((t) => (
            <View key={t.topicId} style={styles.barRow} testID={`topic-bar-${t.topicId}`}>
              <Text style={styles.barLabel}>{t.nameTr}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${Math.round((t.attemptCount / maxAttempts) * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.barCount}>{t.attemptCount}</Text>
            </View>
          ))}

          <Text style={styles.section}>Son 7 gün</Text>
          <View style={styles.weekly} testID="weekly-series">
            {summary.weekly.map((w) => (
              <View key={w.date} style={styles.weekCell}>
                <Text style={styles.weekCount}>{w.solvedCount}</Text>
                <Text style={styles.weekDate}>{w.date.slice(5)}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: space.lg, paddingBottom: space.xl * 2 },
  eyebrow: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.orange,
    marginBottom: 4,
  },
  title: {
    fontFamily: typography.fontFamily,
    fontSize: 28,
    fontWeight: '700',
    color: colors.navy,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: space.lg,
  },
  streak: {
    fontFamily: typography.fontFamily,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: space.md,
  },
  weakCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.orange,
    marginBottom: space.lg,
    ...shadows.soft,
  },
  weakLabel: { color: colors.orange, fontWeight: '700', marginBottom: 4 },
  weakName: { fontSize: 18, fontWeight: '700', color: colors.navy },
  weakMeta: { color: colors.textSecondary, marginTop: 4 },
  section: {
    fontWeight: '700',
    color: colors.navy,
    marginBottom: space.sm,
    marginTop: space.sm,
  },
  barRow: { marginBottom: space.sm },
  barLabel: { color: colors.textPrimary, marginBottom: 4, fontSize: 13 },
  barTrack: {
    height: 10,
    backgroundColor: colors.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: colors.navy },
  barCount: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  weekly: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space.sm,
  },
  weekCell: { alignItems: 'center', flex: 1 },
  weekCount: { fontWeight: '700', color: colors.navy },
  weekDate: { fontSize: 10, color: colors.textSecondary },
});
