import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { filterAttempts } from '@/src/features/history/filterAttempts';
import { EXAM_LABEL } from '@/src/features/exam/examLabels';
import { useActiveExam } from '@/src/features/exam/useActiveExam';
import { findTopic, subjectLabel, subjectsForExam } from '@/src/data';
import { fetchAttempts } from '@/src/lib/api/progressClient';
import type { AttemptListItem, Subject } from '@/src/lib/api/types';
import { colors, radii, shadows, space, typography } from '@/src/theme';
import { EmptyState } from '@/src/ui/EmptyState';
import { Eyebrow } from '@/src/ui/Eyebrow';
import { SegmentedTabs } from '@/src/ui/SegmentedTabs';
import { TR_EYEBROW } from '@/src/lib/trCase';

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export default function HistoryScreen() {
  const router = useRouter();
  const { examType, theme } = useActiveExam();
  const [items, setItems] = useState<AttemptListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState<Subject | 'all'>('all');
  const [topicId, setTopicId] = useState<string | 'all'>('all');

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void (async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await fetchAttempts({ limit: 50 });
          if (!alive) return;
          setItems(res.items);
        } catch {
          if (alive) {
            setItems([]);
            setError('Geçmiş yüklenemedi. Bağlantını kontrol edip tekrar dene.');
          }
        } finally {
          if (alive) setLoading(false);
        }
      })();
      return () => {
        alive = false;
      };
    }, []),
  );

  useEffect(() => {
    setSubject('all');
    setTopicId('all');
  }, [examType]);

  const subjectFilters = useMemo(() => {
    const list = subjectsForExam(examType);
    return [
      { id: 'all' as const, label: 'Tümü' },
      ...list.map((s) => ({ id: s, label: subjectLabel(s) })),
    ];
  }, [examType]);

  const topics = useMemo(() => {
    const ids = new Set<string>();
    for (const i of items) {
      if (i.topicId) {
        if (i.examType && i.examType !== examType) continue;
        if (subject !== 'all' && i.subject !== subject) continue;
        ids.add(i.topicId);
      }
    }
    return ['all', ...Array.from(ids)];
  }, [items, examType, subject]);

  const filtered = filterAttempts(items, {
    examType,
    subject: subject === 'all' ? undefined : subject,
    topicId,
  });

  const examItems = useMemo(
    () => items.filter((i) => !i.examType || i.examType === examType),
    [items, examType],
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.soft }]}
      testID="history-screen">
      <Eyebrow color={theme.solid} style={styles.eyebrow}>
        {TR_EYEBROW.records}
      </Eyebrow>
      <Text style={styles.title}>Geçmiş</Text>
      <Text style={styles.subtitle}>
        {EXAM_LABEL[examType]} çözümlerin. Dersle filtrele; satıra dokununca çözümü aç.
        Mod için Ayarlar.
      </Text>

      <View
        style={[styles.modeChip, { backgroundColor: theme.solid }]}
        testID="history-mode-chip">
        <Text style={styles.modeChipText}>{theme.modeChip}</Text>
      </View>

      <Text style={styles.filterLabel}>Ders</Text>
      <SegmentedTabs
        testID="history-subject-filters"
        itemTestIDPrefix="filter-subject"
        variant="chips"
        value={subject}
        onChange={(id) => {
          setSubject(id);
          setTopicId('all');
        }}
        activeColor={theme.solid}
        accentColor={theme.accent}
        items={subjectFilters}
      />

      {topics.length > 1 ? (
        <>
          <Text style={[styles.filterLabel, styles.filterLabelSpaced]}>Konu</Text>
          <SegmentedTabs
            testID="history-topic-filters"
            itemTestIDPrefix="filter-topic"
            variant="chips"
            value={topicId}
            onChange={setTopicId}
            activeColor={theme.solid}
            accentColor={theme.accent}
            items={topics.map((t) => ({
              id: t,
              label:
                t === 'all' ? 'Tüm konular' : (findTopic(t)?.nameTr ?? t),
            }))}
          />
        </>
      ) : null}

      <View style={styles.listArea}>
        {loading ? (
          <ActivityIndicator color={theme.solid} style={{ marginTop: space.lg }} />
        ) : error ? (
          <EmptyState title="Yüklenemedi" subtitle={error} />
        ) : examItems.length === 0 ? (
          <EmptyState
            title="Henüz kayıt yok"
            subtitle={`${EXAM_LABEL[examType]} modunda henüz soru çözülmedi. Ana sayfadan fotoğraf çek.`}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Filtreye uygun kayıt yok"
            subtitle="Ders veya konu filtresini genişlet."
          />
        ) : (
          <FlatList
            testID="history-list"
            data={filtered}
            keyExtractor={(item) => item.attemptId}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const topicName = item.topicId
                ? findTopic(item.topicId)?.nameTr ?? item.topicId
                : 'Konu yok';
              return (
                <Pressable
                  style={styles.row}
                  testID={`history-item-${item.attemptId}`}
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: '/history/[attemptId]',
                      params: { attemptId: item.attemptId },
                    })
                  }>
                  <View style={styles.rowTop}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {topicName}
                    </Text>
                    <Text style={styles.rowChevron}>›</Text>
                  </View>
                  <Text style={styles.rowMeta}>
                    {subjectLabel(item.subject)}
                    {' · '}
                    {item.status === 'solved' ? 'Çözüldü' : item.status}
                    {item.createdAt ? ` · ${formatWhen(item.createdAt)}` : ''}
                  </Text>
                </Pressable>
              );
            }}
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
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  title: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 28,
    fontWeight: '700',
    color: colors.navy,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: space.md,
    lineHeight: 22,
  },
  modeChip: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: space.md,
  },
  modeChipText: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  filterLabel: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.navy,
    marginBottom: space.sm,
    opacity: 0.72,
  },
  filterLabelSpaced: {
    marginTop: space.md,
  },
  listArea: { flex: 1, marginTop: space.md },
  listContent: { paddingBottom: space.xl },
  row: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingVertical: 14,
    paddingHorizontal: space.md,
    marginBottom: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center' },
  rowTitle: {
    flex: 1,
    fontFamily: typography.fontFamilySemiBold,
    fontWeight: '700',
    color: colors.navy,
    fontSize: 15,
  },
  rowChevron: {
    fontFamily: typography.fontFamily,
    fontSize: 22,
    color: colors.navy,
    marginLeft: space.sm,
  },
  rowMeta: {
    fontFamily: typography.fontFamily,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
});
