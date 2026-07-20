import { StyleSheet, Text, View } from 'react-native';

import { examThemeFor } from '@/src/features/exam/examTheme';
import { subjectThemeFor } from '@/src/features/exam/subjectTheme';
import type { ExamType, Subject } from '@/src/lib/api/types';
import { colors, radii, typography } from '@/src/theme';

export type CatalogBreadcrumbProps = {
  examType: ExamType;
  examLabel: string;
  subject: Subject;
  subjectLabel: string;
  topicLabel?: string | null;
  difficulty?: 'easy' | 'mid' | 'hard' | null;
  testID?: string;
};

/**
 * Colored hierarchy chips: Sınav → Ders → Konu (+ optional difficulty).
 */
export function CatalogBreadcrumb({
  examType,
  examLabel,
  subject,
  subjectLabel: subjectText,
  topicLabel,
  difficulty,
  testID,
}: CatalogBreadcrumbProps) {
  const exam = examThemeFor(examType)!;
  const sub = subjectThemeFor(subject);
  const diffLabel =
    difficulty === 'easy'
      ? 'kolay'
      : difficulty === 'mid'
        ? 'orta'
        : difficulty === 'hard'
          ? 'zor'
          : null;

  return (
    <View style={styles.row} testID={testID}>
      <View style={[styles.chip, { backgroundColor: exam.solid }]}>
        <Text style={styles.chipOn}>{examLabel}</Text>
      </View>
      <Text style={[styles.sep, { color: exam.accent }]}>›</Text>
      <View style={[styles.chip, { backgroundColor: sub.soft, borderColor: sub.solid }]}>
        <Text style={[styles.chipOff, { color: sub.solid }]}>{subjectText}</Text>
      </View>
      {topicLabel ? (
        <>
          <Text style={[styles.sep, { color: sub.solid }]}>›</Text>
          <View style={[styles.chip, styles.chipTopic, { borderColor: exam.accent }]}>
            <Text style={[styles.chipTopicText, { color: exam.solid }]} numberOfLines={1}>
              {topicLabel}
            </Text>
          </View>
        </>
      ) : null}
      {diffLabel ? (
        <View style={[styles.chip, styles.diff]}>
          <Text style={styles.diffText}>{diffLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  chip: {
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipOn: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.2,
  },
  chipOff: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 11,
    fontWeight: '700',
  },
  chipTopic: {
    backgroundColor: colors.white,
    maxWidth: '56%',
  },
  chipTopicText: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 11,
    fontWeight: '700',
  },
  sep: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    fontWeight: '700',
  },
  diff: {
    backgroundColor: colors.navySoft,
    borderColor: colors.border,
  },
  diffText: {
    fontFamily: typography.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
