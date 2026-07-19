import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { doc, getDoc } from 'firebase/firestore';

import { EXAM_LABEL } from '@/src/features/exam/examLabels';
import { setPendingSubjectHint } from '@/src/features/solve/subjectHintStore';
import { itemsForExamSubject } from '@/src/data/itemBank';
import { lessonForTopic } from '@/src/data/topicLessons';
import {
  findTopic,
  subjectLabel,
  subjectsForExam,
  topicsForExamSubject,
} from '@/src/data';
import type { ExamType, Subject } from '@/src/lib/api/types';
import { ensureSignedIn } from '@/src/lib/auth';
import { getFirebase } from '@/src/lib/firebase';
import { colors, radii, shadows, space, typography } from '@/src/theme';
import { EmptyState } from '@/src/ui/EmptyState';
import { SegmentedTabs } from '@/src/ui/SegmentedTabs';

export default function TopicsScreen() {
  const router = useRouter();
  const [examType, setExamType] = useState<ExamType>('lgs');
  const subjects = useMemo(() => subjectsForExam(examType), [examType]);
  const [subject, setSubject] = useState<Subject>(subjects[0] ?? 'math');

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void (async () => {
        try {
          const user = await ensureSignedIn();
          const snap = await getDoc(doc(getFirebase().db, 'users', user.uid));
          const et = snap.data()?.examType;
          if (!alive) return;
          if (et === 'lgs' || et === 'ygs' || et === 'kpss') {
            setExamType(et);
            const nextSubjects = subjectsForExam(et);
            setSubject(nextSubjects[0] ?? 'math');
          }
        } catch {
          /* keep default */
        }
      })();
      return () => {
        alive = false;
      };
    }, []),
  );

  const topics = useMemo(
    () => topicsForExamSubject(examType, subject),
    [examType, subject],
  );
  const samples = useMemo(
    () => itemsForExamSubject(examType, subject),
    [examType, subject],
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="topics-screen">
      <Text style={styles.eyebrow}>Müfredat · anlatım</Text>
      <Text style={styles.title}>Konu anlatımı</Text>
      <Text style={styles.subtitle}>
        {EXAM_LABEL[examType]} için konuyu seç → kısa öğretmen anlatımı + örnek soru.
        Telifsiz, özgün içerik.
      </Text>

      <Text style={styles.filterLabel}>Ders</Text>
      <SegmentedTabs
        testID="topics-subject-filters"
        itemTestIDPrefix="topics-subject"
        variant="chips"
        value={subject}
        onChange={(id) => {
          setSubject(id);
          if (id !== 'unknown') setPendingSubjectHint(id);
        }}
        items={subjects.map((s) => ({ id: s, label: subjectLabel(s) }))}
      />

      <Text style={[styles.filterLabel, styles.spaced]}>Konular</Text>
      {topics.length === 0 ? (
        <EmptyState title="Bu derste konu yok" subtitle="Başka bir ders seç." />
      ) : (
        <View style={styles.topicGrid} testID="topics-list">
          {topics.map((t) => {
            const hasLesson = Boolean(lessonForTopic(t.id));
            const sampleCount = samples.filter((s) => s.topicId === t.id).length;
            return (
              <Pressable
                key={t.id}
                style={[styles.topicChip, hasLesson && styles.topicChipRich]}
                testID={`catalog-topic-${t.id}`}
                accessibilityRole="button"
                onPress={() =>
                  router.push({ pathname: '/topic/[id]', params: { id: t.id } })
                }>
                <Text style={styles.topicChipText}>{t.nameTr}</Text>
                <Text style={styles.topicChipMeta}>
                  {hasLesson ? 'Anlatım' : 'Özet'}
                  {sampleCount > 0 ? ` · ${sampleCount} örnek` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <Pressable
        style={styles.photoCta}
        testID="topics-photo-cta"
        accessibilityRole="button"
        onPress={() => {
          if (subject !== 'unknown') setPendingSubjectHint(subject);
          router.push('/(tabs)');
        }}>
        <Text style={styles.photoCtaText}>
          Bu dersten soru çek ({subjectLabel(subject)})
        </Text>
        <Text style={styles.photoCtaSub}>
          Ana sayfada kamera veya galeri — AI’ya ders ipucu gider
        </Text>
      </Pressable>

      <Text style={[styles.filterLabel, styles.spaced]}>
        Örnek soru & adım adım anlatım
      </Text>
      {samples.length === 0 ? (
        <View style={styles.emptySamples}>
          <Text style={styles.hint}>
            Bu ders için örnek madde henüz yok. Yukarıdan konu seçip kısa anlatımı oku veya
            fotoğrafla canlı çözüm al.
          </Text>
        </View>
      ) : (
        samples.map((item) => {
          const topic = findTopic(item.topicId);
          return (
            <Pressable
              key={item.id}
              style={styles.card}
              testID={`topic-item-${item.id}`}
              accessibilityRole="button"
              onPress={() =>
                router.push({ pathname: '/sample/[id]', params: { id: item.id } })
              }>
              <Text style={styles.cardKicker}>
                {subjectLabel(item.subject)}
                {topic ? ` · ${topic.nameTr}` : ''}
                {item.difficulty === 'easy'
                  ? ' · kolay'
                  : item.difficulty === 'mid'
                    ? ' · orta'
                    : ' · zor'}
              </Text>
              <Text style={styles.cardTitle} numberOfLines={3}>
                {item.stem}
              </Text>
              <Text style={styles.cardCta}>Konuyu + çözümü gör →</Text>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.xl * 2,
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
    marginTop: 6,
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
  spaced: { marginTop: space.lg },
  topicGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  topicChip: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    minWidth: '46%',
    flexGrow: 1,
  },
  topicChipRich: {
    borderColor: colors.orange,
    backgroundColor: colors.orangeSoft,
  },
  topicChipText: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
  },
  topicChipMeta: {
    fontFamily: typography.fontFamily,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
  },
  hint: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  emptySamples: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: space.md,
    marginBottom: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  cardKicker: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: colors.orange,
    marginBottom: 6,
  },
  cardTitle: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    fontWeight: '600',
    color: colors.navy,
    lineHeight: 22,
  },
  cardCta: {
    fontFamily: typography.fontFamily,
    marginTop: space.md,
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
  },
  photoCta: {
    backgroundColor: colors.navy,
    borderRadius: radii.xl,
    padding: space.md,
    marginTop: space.md,
    marginBottom: space.sm,
  },
  photoCtaText: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  photoCtaSub: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
    lineHeight: 17,
  },
});
