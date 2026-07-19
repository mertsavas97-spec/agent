import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { findTopic, subjectLabel } from '@/src/data';
import { itemsForTopic } from '@/src/data/itemBank';
import { lessonForTopic } from '@/src/data/topicLessons';
import { EXAM_LABEL } from '@/src/features/exam/examLabels';
import { colors, radii, shadows, space, typography } from '@/src/theme';

export default function TopicLessonScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const topic = typeof id === 'string' ? findTopic(id) : undefined;
  const lesson = topic
    ? lessonForTopic(topic.id, {
        nameTr: topic.nameTr,
        subject: topic.subject,
        examType: topic.examType,
      })
    : null;
  const samples = topic ? itemsForTopic(topic.id) : [];

  if (!topic || !lesson) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Konu bulunamadı.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      testID="topic-lesson-screen">
      <Text style={styles.kicker}>
        {EXAM_LABEL[topic.examType]} · {subjectLabel(topic.subject)}
      </Text>
      <Text style={styles.title}>{topic.nameTr}</Text>
      <Text style={styles.headline}>{lesson.headline}</Text>

      {lesson.bullets.map((b, i) => (
        <View key={i} style={styles.bulletCard}>
          <Text style={styles.bulletIndex}>{i + 1}</Text>
          <Text style={styles.bulletBody}>{b}</Text>
        </View>
      ))}

      <View style={styles.tipBox}>
        <Text style={styles.tipLabel}>Öğretmen ipucu</Text>
        <Text style={styles.tipBody}>{lesson.tip}</Text>
      </View>

      {samples.length > 0 ? (
        <>
          <Text style={styles.section}>Bu konudan örnek</Text>
          {samples.map((item) => (
            <Pressable
              key={item.id}
              style={styles.sampleCard}
              testID={`topic-sample-${item.id}`}
              onPress={() =>
                router.push({ pathname: '/sample/[id]', params: { id: item.id } })
              }>
              <Text style={styles.sampleStem} numberOfLines={3}>
                {item.stem}
              </Text>
              <Text style={styles.sampleCta}>Çözümü aç →</Text>
            </Pressable>
          ))}
        </>
      ) : (
        <Text style={styles.noSample}>Bu konuda örnek soru yakında eklenecek.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { padding: space.lg, paddingBottom: space.xl * 2 },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  missingText: { color: colors.textSecondary, fontFamily: typography.fontFamily },
  kicker: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.orange,
    marginBottom: space.sm,
  },
  title: {
    fontFamily: typography.fontFamily,
    fontSize: 26,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 6,
  },
  headline: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: space.lg,
  },
  bulletCard: {
    flexDirection: 'row',
    gap: space.md,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: space.md,
    marginBottom: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  bulletIndex: {
    fontFamily: typography.fontFamilySemiBold,
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    textAlign: 'center',
    lineHeight: 28,
    backgroundColor: colors.navy,
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  bulletBody: {
    flex: 1,
    fontFamily: typography.fontFamily,
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  tipBox: {
    marginTop: space.md,
    backgroundColor: colors.orangeSoft,
    borderRadius: radii.lg,
    padding: space.md,
    marginBottom: space.lg,
  },
  tipLabel: {
    fontFamily: typography.fontFamilySemiBold,
    fontWeight: '700',
    color: colors.orange,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  tipBody: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: colors.navy,
    lineHeight: 21,
  },
  section: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 15,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: space.sm,
  },
  sampleCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: space.md,
    marginBottom: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sampleStem: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: colors.navy,
    lineHeight: 21,
  },
  sampleCta: {
    marginTop: space.sm,
    fontFamily: typography.fontFamily,
    fontWeight: '700',
    color: colors.orange,
    fontSize: 13,
  },
  noSample: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: space.md,
  },
});
