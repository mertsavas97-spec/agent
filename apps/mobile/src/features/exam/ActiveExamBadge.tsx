import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EXAM_LABEL } from '@/src/features/exam/examLabels';
import { examThemeFor } from '@/src/features/exam/examTheme';
import type { ExamType } from '@/src/lib/api/types';
import { colors, radii, space, typography } from '@/src/theme';

export type ActiveExamBadgeProps = {
  examType: ExamType | null;
  onPressChange?: () => void;
};

/** Read-only active package chip — change lives in Settings (ad-gated). */
export function ActiveExamBadge({ examType, onPressChange }: ActiveExamBadgeProps) {
  const theme = examThemeFor(examType);
  const label = examType ? EXAM_LABEL[examType] : '—';

  return (
    <View
      style={[
        styles.row,
        theme
          ? { backgroundColor: theme.soft, borderColor: theme.accent }
          : null,
      ]}
      testID="home-active-exam">
      <View style={{ flex: 1 }}>
        <Text style={styles.kicker}>Aktif paket</Text>
        <Text
          style={[styles.label, theme ? { color: theme.solid } : null]}
          testID="home-active-exam-label">
          {theme?.modeChip ?? `MOD: ${label}`}
        </Text>
      </View>
      {onPressChange ? (
        <Pressable
          testID="home-change-exam"
          accessibilityRole="button"
          accessibilityLabel="Sınav paketini ayarlardan değiştir"
          style={styles.changeBtn}
          onPress={onPressChange}>
          <Text style={styles.changeLabel}>Değiştir</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    marginBottom: space.md,
  },
  kicker: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 2,
  },
  label: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
  },
  changeBtn: {
    backgroundColor: colors.navy,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  changeLabel: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
});
