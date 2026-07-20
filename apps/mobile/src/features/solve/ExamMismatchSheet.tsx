import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { EXAM_LABEL } from '@/src/features/exam/examLabels';
import type { ExamHintMeta, ExamType } from '@/src/lib/api/types';
import { colors, radii, space, typography } from '@/src/theme';

export type ExamMismatchSheetProps = {
  visible: boolean;
  profileExam: ExamType;
  hint: ExamHintMeta;
  onKeepProfile: () => void;
  onSwitchSuggested: () => void;
};

export function ExamMismatchSheet({
  visible,
  profileExam,
  hint,
  onKeepProfile,
  onSwitchSuggested,
}: ExamMismatchSheetProps) {
  const suggested = hint.suggested;
  if (!suggested) return null;

  const qNote =
    hint.questionNumber != null
      ? ` Görselde soru no: ${hint.questionNumber}.`
      : '';

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet} testID="exam-mismatch-sheet">
          <Text style={styles.title}>Sınav eşleşmiyor olabilir</Text>
          <Text style={styles.body}>
            Profilinde {EXAM_LABEL[profileExam]} seçili; bu soru daha çok{' '}
            {EXAM_LABEL[suggested]} kitapçığına benziyor.{qNote} Hangisiyle devam
            edelim?
          </Text>

          <Pressable
            testID="exam-switch-suggested"
            style={styles.primary}
            onPress={onSwitchSuggested}>
            <Text style={styles.primaryText}>
              {EXAM_LABEL[suggested]} ile devam et
            </Text>
          </Pressable>

          <Pressable
            testID="exam-keep-profile"
            style={styles.secondary}
            onPress={onKeepProfile}>
            <Text style={styles.secondaryText}>
              {EXAM_LABEL[profileExam]} olarak kalsın
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(30, 27, 75, 0.45)',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: space.lg,
    paddingBottom: space.xl,
    gap: space.sm,
  },
  title: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 20,
    color: colors.navy,
  },
  body: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    marginBottom: space.sm,
  },
  primary: {
    backgroundColor: colors.navy,
    borderRadius: radii.md,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  primaryText: {
    color: colors.white,
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 15,
  },
  secondary: {
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: radii.md,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  secondaryText: {
    color: colors.navy,
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 15,
  },
});
