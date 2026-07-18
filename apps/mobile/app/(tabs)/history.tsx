import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { filterAttempts } from '@/src/features/history/filterAttempts';
import { fetchAttempts } from '@/src/lib/api/progressClient';
import type { AttemptListItem, Subject } from '@/src/lib/api/types';
import { colors, radii, space } from '@/src/theme';

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
      <Text style={styles.title}>Geçmiş</Text>

      <View style={styles.filters} testID="history-subject-filters">
        {SUBJECTS.map((s) => (
          <Pressable
            key={s.id}
            testID={`filter-subject-${s.id}`}
            style={[styles.chip, subject === s.id && styles.chipOn]}
            onPress={() => setSubject(s.id)}>
            <Text style={[styles.chipLabel, subject === s.id && styles.chipLabelOn]}>
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.filters} testID="history-topic-filters">
        {topics.map((t) => (
          <Pressable
            key={t}
            testID={`filter-topic-${t}`}
            style={[styles.chip, topicId === t && styles.chipOn]}
            onPress={() => setTopicId(t)}>
            <Text style={[styles.chipLabel, topicId === t && styles.chipLabelOn]}>
              {t === 'all' ? 'Tüm konular' : t}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.navy} />
      ) : filtered.length === 0 ? (
        <Text style={styles.empty}>Henüz çözülmüş soru yok</Text>
      ) : (
        <FlatList
          testID="history-list"
          data={filtered}
          keyExtractor={(item) => item.attemptId}
          renderItem={({ item }) => (
            <View style={styles.row} testID={`history-item-${item.attemptId}`}>
              <Text style={styles.rowTitle}>{item.topicId ?? 'Konu yok'}</Text>
              <Text style={styles.rowMeta}>
                {item.subject} · {item.status}
              </Text>
            </View>
          )}
        />
      )}
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
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginBottom: space.sm,
  },
  chip: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.sm,
    paddingVertical: 6,
    backgroundColor: colors.white,
  },
  chipOn: { borderColor: colors.orange, backgroundColor: '#FFFBEB' },
  chipLabel: { color: colors.textSecondary, fontSize: 13 },
  chipLabelOn: { color: colors.navy, fontWeight: '700' },
  empty: { color: colors.textSecondary, marginTop: space.md },
  row: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: space.md,
    marginBottom: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowTitle: { fontWeight: '600', color: colors.navy },
  rowMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
});
