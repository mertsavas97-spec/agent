import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { filterAttempts } from '@/src/features/history/filterAttempts';
import { fetchAttempts } from '@/src/lib/api/progressClient';
import type { AttemptListItem, Subject } from '@/src/lib/api/types';
import { colors, radii, shadows, space, typography } from '@/src/theme';
import { EmptyState } from '@/src/ui/EmptyState';
import { SegmentedTabs } from '@/src/ui/SegmentedTabs';

const SUBJECTS: { id: Subject | 'all'; label: string }[] = [
  { id: 'all', label: 'Tümü' },
  { id: 'math', label: 'Matematik' },
  { id: 'turkish', label: 'Türkçe' },
];

export default function HistoryScreen() {
  const [items, setItems] = useState<AttemptListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState<Subject | 'all'>('all');
  const [topicId, setTopicId] = useState<string | 'all'>('all');

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void (async () => {
        setLoading(true);
        try {
          const res = await fetchAttempts({ limit: 50 });
          if (!alive) return;
          setItems(res.items);
        } catch {
          if (alive) setItems([]);
        } finally {
          if (alive) setLoading(false);
        }
      })();
      return () => {
        alive = false;
      };
    }, []),
  );

  const topics = useMemo(() => {
    const ids = new Set<string>();
    for (const i of items) {
      if (i.topicId) ids.add(i.topicId);
    }
    return ['all', ...Array.from(ids)];
  }, [items]);

  const filtered = filterAttempts(items, { subject, topicId });

  return (
    <View style={styles.container} testID="history-screen">
      <Text style={styles.eyebrow}>Kütüphane</Text>
      <Text style={styles.title}>Geçmiş</Text>
      <Text style={styles.subtitle}>Çözdüğün soruları derse ve konuya göre filtrele.</Text>

      <Text style={styles.filterLabel}>Ders</Text>
      <SegmentedTabs
        testID="history-subject-filters"
        itemTestIDPrefix="filter-subject"
        variant="chips"
        value={subject}
        onChange={setSubject}
        items={SUBJECTS}
      />

      <Text style={[styles.filterLabel, styles.filterLabelSpaced]}>Konu</Text>
      <SegmentedTabs
        testID="history-topic-filters"
        itemTestIDPrefix="filter-topic"
        variant="chips"
        value={topicId}
        onChange={setTopicId}
        items={topics.map((t) => ({
          id: t,
          label: t === 'all' ? 'Tüm konular' : t,
        }))}
      />

      <View style={styles.listArea}>
        {loading ? (
          <ActivityIndicator color={colors.navy} style={{ marginTop: space.lg }} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Henüz çözülmüş soru yok"
            subtitle="Ana sayfadan fotoğraf çekerek ilk çözümünü kaydet."
          />
        ) : (
          <FlatList
            testID="history-list"
            data={filtered}
            keyExtractor={(item) => item.attemptId}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.row} testID={`history-item-${item.attemptId}`}>
                <Text style={styles.rowTitle}>{item.topicId ?? 'Konu yok'}</Text>
                <Text style={styles.rowMeta}>
                  {item.subject === 'math' ? 'Matematik' : item.subject === 'turkish' ? 'Türkçe' : item.subject}
                  {' · '}
                  {item.status === 'solved' ? 'Çözüldü' : item.status}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
  },
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
    lineHeight: 20,
  },
  filterLabel: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: space.sm,
  },
  filterLabelSpaced: {
    marginTop: space.md,
  },
  listArea: { flex: 1, marginTop: space.md },
  listContent: { paddingBottom: space.xl },
  row: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: space.md,
    marginBottom: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  rowTitle: {
    fontFamily: typography.fontFamily,
    fontWeight: '600',
    color: colors.navy,
    fontSize: 15,
  },
  rowMeta: {
    fontFamily: typography.fontFamily,
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
});
