import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { findTopic, subjectLabel } from '@/src/data';
import { itemsForTopic } from '@/src/data/itemBank';
import { lessonForTopic } from '@/src/data/topicLessons';
import { EXAM_LABEL } from '@/src/features/exam/examLabels';
import { examThemeFor } from '@/src/features/exam/examTheme';
import { subjectThemeFor } from '@/src/features/exam/subjectTheme';
import { colors, radii, shadows, space, typography } from '@/src/theme';
import { CatalogBreadcrumb } from '@/src/ui/CatalogBreadcrumb';
import { Eyebrow } from '@/src/ui/Eyebrow';
import { TR_EYEBROW, trUpper } from '@/src/lib/trCase';

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
  const theme = topic ? examThemeFor(topic.examType) : null;
  const subjectTheme = topic ? subjectThemeFor(topic.subject) : null;

  if (!topic || !lesson) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Konu bulunamadı.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.root, theme ? { backgroundColor: theme.soft } : null]}
      contentContainerStyle={styles.content}
      testID="topic-lesson-screen">
      <CatalogBreadcrumb
        examType={topic.examType}
        examLabel={EXAM_LABEL[topic.examType]}
        subject={topic.subject}
        subjectLabel={subjectLabel(topic.subject)}
        topicLabel={topic.nameTr}
      />
      <View
        style={[
          styles.modeChip,
          { backgroundColor: theme?.solid ?? colors.navy },
        ]}>
        <Text style={styles.modeChipText}>{theme?.modeChip ?? EXAM_LABEL[topic.examType]}</Text>
      </View>
      <Eyebrow style={[styles.kicker, subjectTheme ? { color: subjectTheme.solid } : null]}>
        {trUpper(subjectLabel(topic.subject))}
      </Eyebrow>
      <Text style={[styles.title, theme ? { color: theme.solid } : null]}>{topic.nameTr}</Text>
      <Text style={styles.headline}>{lesson.headline}</Text>

      {lesson.bullets.map((b, i) => (
        <View
          key={i}
          style={[
            styles.bulletCard,
            subjectTheme ? { borderLeftColor: subjectTheme.solid, borderLeftWidth: 3 } : null,
          ]}>
          <Text style={[styles.bulletIndex, theme ? { color: theme.solid } : null]}>
            {i + 1}
          </Text>
          <Text style={styles.bulletBody}>{b}</Text>
        </View>
      ))}

      <View
        style={[
          styles.tipBox,
          theme ? { borderColor: theme.accent, backgroundColor: theme.soft } : null,
        ]}>
        <Eyebrow style={[styles.tipLabel, theme ? { color: theme.solid } : null]}>
          {TR_EYEBROW.teacherTip}
        </Eyebrow>
        <Text style={styles.tipBody}>{lesson.tip}</Text>
      </View>

      {samples.length > 0 ? (
        <>
          <Text style={[styles.section, theme ? { color: theme.solid } : null]}>
            Bu konudan örnek
          </Text>
          {samples.map((item) => (
            <Pressable
              key={item.id}
              style={[
                styles.sampleCard,
                subjectTheme ? { borderColor: subjectTheme.solid } : null,
              ]}
              testID={`topic-sample-${item.id}`}
              onPress={() =>
                router.push({ pathname: '/sample/[id]', params: { id: item.id } })
              }>
              <Text style={styles.sampleStem} numberOfLines={3}>
                {item.stem}
              </Text>
              <Text style={[styles.sampleCta, theme ? { color: theme.solid } : null]}>
                Çözümü aç →
              </Text>
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
  modeChip: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: space.sm,
  },
  modeChipText: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  kicker: {
    letterSpacing: 0.5,
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
    letterSpacing: 0.4,
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
