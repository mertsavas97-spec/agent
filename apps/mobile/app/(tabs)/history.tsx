import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { doc, getDoc } from 'firebase/firestore';

import { filterAttempts } from '@/src/features/history/filterAttempts';
import { EXAM_LABEL, EXAM_OPTIONS } from '@/src/features/exam/examLabels';
import { findTopic, subjectLabel, subjectsForExam } from '@/src/data';
import { fetchAttempts } from '@/src/lib/api/progressClient';
import type { AttemptListItem, ExamType, Subject } from '@/src/lib/api/types';
import { ensureSignedIn } from '@/src/lib/auth';
import { getFirebase } from '@/src/lib/firebase';
import { colors, radii, shadows, space, typography } from '@/src/theme';
import { EmptyState } from '@/src/ui/EmptyState';
import { SegmentedTabs } from '@/src/ui/SegmentedTabs';

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
  const [items, setItems] = useState<AttemptListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [examType, setExamType] = useState<ExamType | 'all'>('all');
  const [profileExam, setProfileExam] = useState<ExamType>('lgs');
  const examSeededRef = useRef(false);
  const [subject, setSubject] = useState<Subject | 'all'>('all');
  const [topicId, setTopicId] = useState<string | 'all'>('all');

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void (async () => {
        setLoading(true);
        setError(null);
        try {
          const user = await ensureSignedIn();
          try {
            const snap = await getDoc(doc(getFirebase().db, 'users', user.uid));
            const et = snap.data()?.examType;
            if (et === 'lgs' || et === 'ygs' || et === 'kpss' || et === 'trafik') {
              setProfileExam(et);
              if (!examSeededRef.current) {
                setExamType(et);
                examSeededRef.current = true;
              }
            }
          } catch {
            /* keep */
          }
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

  const examForSubjects = examType === 'all' ? profileExam : examType;

  const subjectFilters = useMemo(() => {
    const list = subjectsForExam(examForSubjects);
    return [
      { id: 'all' as const, label: 'Tümü' },
      ...list.map((s) => ({ id: s, label: subjectLabel(s) })),
    ];
  }, [examForSubjects]);

  const topics = useMemo(() => {
    const ids = new Set<string>();
    for (const i of items) {
      if (i.topicId) {
        if (examType !== 'all' && i.examType && i.examType !== examType) continue;
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

  return (
    <View style={styles.container} testID="history-screen">
      <Text style={styles.eyebrow}>Kayıtlar</Text>
      <Text style={styles.title}>Geçmiş</Text>
      <Text style={styles.subtitle}>
        Çözdüğün sorular burada. Sınav ve dersle filtrele; satıra dokununca çözümü aç.
      </Text>

      <Text style={styles.filterLabel}>Sınav</Text>
      <SegmentedTabs
        testID="history-exam-filters"
        itemTestIDPrefix="filter-exam"
        variant="chips"
        value={examType}
        onChange={(id) => {
          setExamType(id);
          setSubject('all');
          setTopicId('all');
        }}
        items={[
          { id: 'all' as const, label: 'Tümü' },
          ...EXAM_OPTIONS.map((o) => ({ id: o.id, label: o.label })),
        ]}
      />

      <Text style={[styles.filterLabel, styles.filterLabelSpaced]}>Ders</Text>
      <SegmentedTabs
        testID="history-subject-filters"
        itemTestIDPrefix="filter-subject"
        variant="chips"
        value={subject}
        onChange={(id) => {
          setSubject(id);
          setTopicId('all');
        }}
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
          <ActivityIndicator color={colors.navy} style={{ marginTop: space.lg }} />
        ) : error ? (
          <EmptyState title="Yüklenemedi" subtitle={error} />
        ) : items.length === 0 ? (
          <EmptyState
            title="Henüz kayıt yok"
            subtitle="Ana sayfadan soru fotoğrafı çek — çözümler burada listelenir."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Filtreye uygun kayıt yok"
            subtitle="Sınav veya ders filtresini genişlet."
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
              const examChip = item.examType ? EXAM_LABEL[item.examType] : null;
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
                    {examChip ? `${examChip} · ` : ''}
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
  rowTop: { flexDirection: 'row', alignItems: 'center' },
  rowTitle: {
    flex: 1,
    fontFamily: typography.fontFamily,
    fontWeight: '600',
    color: colors.navy,
    fontSize: 15,
  },
  rowChevron: {
    fontFamily: typography.fontFamily,
    fontSize: 20,
    color: colors.navy,
    marginLeft: space.sm,
  },
  rowMeta: {
    fontFamily: typography.fontFamily,
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
});
