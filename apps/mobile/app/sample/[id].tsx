import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { findItem } from '@/src/data/itemBank';
import { findTopic, subjectLabel } from '@/src/data';
import { lessonForTopic } from '@/src/data/topicLessons';
import { EXAM_LABEL } from '@/src/features/exam/examLabels';
import { examThemeFor } from '@/src/features/exam/examTheme';
import { subjectThemeFor } from '@/src/features/exam/subjectTheme';
import { colors, radii, shadows, space, typography } from '@/src/theme';
import { CatalogBreadcrumb } from '@/src/ui/CatalogBreadcrumb';
import { TR_EYEBROW } from '@/src/lib/trCase';

export default function SampleItemScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const item = typeof id === 'string' ? findItem(id) : undefined;
  const topic = item ? findTopic(item.topicId) : undefined;
  const lesson =
    item && topic
      ? lessonForTopic(item.topicId, {
          nameTr: topic.nameTr,
          subject: topic.subject,
          examType: topic.examType,
        })
      : item
        ? lessonForTopic(item.topicId)
        : null;
  const examTheme = item ? examThemeFor(item.examType) : null;
  const subjectTheme = item ? subjectThemeFor(item.subject) : null;

  if (!item) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Örnek soru bulunamadı.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.root, examTheme ? { backgroundColor: examTheme.soft } : null]}
      contentContainerStyle={styles.content}
      testID="sample-item-screen">
      <CatalogBreadcrumb
        examType={item.examType}
        examLabel={EXAM_LABEL[item.examType]}
        subject={item.subject}
        subjectLabel={subjectLabel(item.subject)}
        topicLabel={topic?.nameTr}
        difficulty={item.difficulty}
      />
      <Text style={[styles.stem, examTheme ? { color: examTheme.solid } : null]}>
        {item.stem}
      </Text>

      {lesson ? (
        <View style={styles.lessonBlock} testID="sample-topic-lesson">
          <Text style={styles.section}>Önce konuyu hatırla</Text>
          <Text style={styles.lessonHeadline}>{lesson.headline}</Text>
          {lesson.bullets.map((b, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletBody}>{b}</Text>
            </View>
          ))}
          <Text style={styles.tipInline}>İpucu: {lesson.tip}</Text>
          {topic ? (
            <Pressable
              onPress={() =>
                router.push({ pathname: '/topic/[id]', params: { id: topic.id } })
              }
              testID="sample-open-topic">
              <Text style={styles.topicLink}>Tam konu anlatımına git →</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <Text style={styles.section}>Şıklar</Text>
      {(['A', 'B', 'C', 'D', 'E'] as const).map((key) => {
        const correct = key === item.answerKey;
        return (
          <View key={key} style={[styles.choice, correct && styles.choiceOn]}>
            <Text style={[styles.choiceKey, correct && styles.choiceKeyOn]}>{key}</Text>
            <Text style={[styles.choiceBody, correct && styles.choiceBodyOn]}>
              {item.choices[key]}
            </Text>
            {correct ? <Text style={styles.correctBadge}>{TR_EYEBROW.correct}</Text> : null}
          </View>
        );
      })}

      <Text style={styles.section}>Adım adım anlatım</Text>
      {item.explanationSteps.map((step, idx) => (
        <View key={`${step.title}-${idx}`} style={styles.step}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepNum}>{idx + 1}</Text>
            <Text style={styles.stepTitle}>{step.title}</Text>
          </View>
          <Text style={styles.stepBody}>{step.body}</Text>
        </View>
      ))}

      <Text style={styles.note}>{item.transparencyNote}</Text>
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
    color: colors.orange,
    marginBottom: space.sm,
  },
  stem: {
    fontFamily: typography.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: colors.navy,
    lineHeight: 26,
    marginBottom: space.lg,
  },
  lessonBlock: {
    backgroundColor: colors.navySoft,
    borderRadius: radii.xl,
    padding: space.md,
    marginBottom: space.lg,
  },
  lessonHeadline: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 15,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: space.sm,
    lineHeight: 22,
  },
  bulletRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  bulletDot: { color: colors.orange, fontWeight: '700', fontSize: 15 },
  bulletBody: {
    flex: 1,
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  tipInline: {
    marginTop: space.sm,
    fontFamily: typography.fontFamily,
    fontSize: 13,
    color: colors.navy,
    lineHeight: 19,
    fontWeight: '600',
  },
  topicLink: {
    marginTop: space.sm,
    fontFamily: typography.fontFamily,
    fontWeight: '700',
    color: colors.orange,
    fontSize: 13,
  },
  section: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: space.sm,
    marginTop: space.sm,
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: space.md,
    marginBottom: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  choiceOn: {
    borderColor: colors.orange,
    backgroundColor: colors.orangeSoft,
  },
  choiceKey: {
    fontFamily: typography.fontFamily,
    fontWeight: '700',
    color: colors.navy,
    width: 20,
  },
  choiceKeyOn: { color: colors.orange },
  choiceBody: {
    fontFamily: typography.fontFamily,
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
  },
  choiceBodyOn: { fontWeight: '600' },
  correctBadge: {
    fontFamily: typography.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: colors.orange,
  },
  step: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: space.md,
    marginBottom: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: 6 },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    textAlign: 'center',
    lineHeight: 24,
    backgroundColor: colors.navy,
    color: colors.white,
    fontFamily: typography.fontFamilySemiBold,
    fontWeight: '700',
    fontSize: 12,
  },
  stepTitle: {
    fontFamily: typography.fontFamily,
    fontWeight: '700',
    color: colors.navy,
    flex: 1,
  },
  stepBody: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  note: {
    fontFamily: typography.fontFamily,
    marginTop: space.md,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
});
