import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ExamModeSwitcher } from '@/src/features/exam/ExamModeSwitcher';
import { EXAM_LABEL } from '@/src/features/exam/examLabels';
import type { ExamType } from '@/src/lib/api/types';
import { colors, radii, space, typography } from '@/src/theme';

export type ProfilePanelProps = {
  examType: ExamType | null;
  onExamChange: (exam: ExamType) => void;
  examSwitchDisabled?: boolean;
  quotaLabel: string;
  consentLabel: string;
  catalogCount: number;
  deleteRequested: boolean;
  onSignOut: () => void;
  onRequestDelete: () => void;
};

export function ProfilePanel({
  examType,
  onExamChange,
  examSwitchDisabled,
  quotaLabel,
  consentLabel,
  catalogCount,
  deleteRequested,
  onSignOut,
  onRequestDelete,
}: ProfilePanelProps) {
  return (
    <View style={styles.container} testID="profile-screen">
      <Text style={styles.title}>Profil</Text>
      <Text style={styles.meta} testID="profile-exam">
        Aktif sınav: {examType ? EXAM_LABEL[examType] : '—'}
      </Text>
      <ExamModeSwitcher
        value={examType}
        onChange={onExamChange}
        disabled={examSwitchDisabled}
      />
      <Text style={styles.meta} testID="profile-quota">
        Bugünkü kalan hak: {quotaLabel}
      </Text>
      <Text style={styles.meta} testID="profile-consent">
        KVKK / onay: {consentLabel}
      </Text>
      <Text style={styles.meta} testID="topic-catalog-count">
        Bu sınavın konu kataloğu: {catalogCount} başlık
      </Text>
      <Text style={styles.note}>
        Sınav değiştirmek geçmiş kayıtları silmez; yeni çözümler seçili moda göre üretilir.
      </Text>

      <Pressable
        testID="profile-sign-out"
        accessibilityRole="button"
        style={styles.secondaryBtn}
        onPress={onSignOut}>
        <Text style={styles.secondaryLabel}>Çıkış yap</Text>
      </Pressable>

      {deleteRequested ? (
        <Text style={styles.deleteFlag} testID="profile-delete-pending">
          Veri silme talebin alındı. İşlem tamamlanınca hesabın kapatılacak.
        </Text>
      ) : (
        <Pressable
          testID="profile-delete-request"
          accessibilityRole="button"
          style={styles.dangerBtn}
          onPress={onRequestDelete}>
          <Text style={styles.dangerLabel}>Veri silme talebi</Text>
        </Pressable>
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
    fontFamily: typography.fontFamily,
    fontSize: 22,
    fontWeight: typography.headingWeight,
    color: colors.navy,
    marginBottom: space.md,
  },
  meta: {
    color: colors.textSecondary,
    marginBottom: space.sm,
  },
  note: {
    marginTop: space.md,
    marginBottom: space.lg,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.navy,
    borderRadius: radii.md,
    paddingVertical: space.md,
    alignItems: 'center',
    marginBottom: space.md,
  },
  secondaryLabel: {
    color: colors.navy,
    fontWeight: typography.captionWeight,
  },
  dangerBtn: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radii.md,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  dangerLabel: {
    color: colors.danger,
    fontWeight: typography.captionWeight,
  },
  deleteFlag: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
});
