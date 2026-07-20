import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { subjectLabel, subjectsForExam } from '@/src/data';
import type { ExamType, Subject } from '@/src/lib/api/types';
import { colors, radii, space, typography } from '@/src/theme';

export type SubjectConfirmSheetProps = {
  visible: boolean;
  examType: ExamType;
  suggested: Exclude<Subject, 'unknown'>;
  selected: Exclude<Subject, 'unknown'>;
  confidence?: 'high' | 'medium' | 'low';
  onSelect: (subject: Exclude<Subject, 'unknown'>) => void;
  onConfirm: () => void;
  onDismiss?: () => void;
};

export function SubjectConfirmSheet({
  visible,
  examType,
  suggested,
  selected,
  confidence,
  onSelect,
  onConfirm,
  onDismiss,
}: SubjectConfirmSheetProps) {
  const options = subjectsForExam(examType);
  const unsure = confidence === 'medium' || confidence === 'low' || !confidence;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.sheet} testID="subject-confirm-sheet">
          <Text style={styles.title}>Ders hangisi?</Text>
          <Text style={styles.body}>
            {unsure
              ? `Tahmin: ${subjectLabel(suggested)} — emin değilsek yanlış etiketi yapıştırmıyoruz. Doğru dersi seç.`
              : `Bu soruyu ${subjectLabel(suggested)} olarak gördük. Değiştirmek istersen seç.`}
          </Text>

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {options.map((s) => {
              const active = s === selected;
              return (
                <Pressable
                  key={s}
                  testID={`subject-option-${s}`}
                  onPress={() => onSelect(s)}
                  style={[styles.option, active && styles.optionActive]}>
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>
                    {subjectLabel(s)}
                    {s === suggested ? ' · tahmin' : ''}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable
            testID="subject-confirm-continue"
            onPress={onConfirm}
            style={styles.cta}>
            <Text style={styles.ctaText}>Devam et</Text>
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
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.xl,
    maxHeight: '78%',
  },
  title: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 20,
    color: colors.navy,
    marginBottom: space.xs,
  },
  body: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: space.md,
  },
  list: {
    maxHeight: 320,
  },
  listContent: {
    gap: space.sm,
    paddingBottom: space.md,
  },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    backgroundColor: colors.surface,
  },
  optionActive: {
    borderColor: colors.navy,
    backgroundColor: colors.navySoft,
  },
  optionText: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 15,
    color: colors.textPrimary,
  },
  optionTextActive: {
    fontFamily: typography.fontFamilySemiBold,
    color: colors.navy,
  },
  cta: {
    backgroundColor: colors.navy,
    borderRadius: radii.md,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  ctaText: {
    color: colors.white,
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 16,
  },
});
