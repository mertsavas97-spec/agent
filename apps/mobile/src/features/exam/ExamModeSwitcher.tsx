import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ExamType } from '@/src/lib/api/types';
import { colors, radii, space, typography } from '@/src/theme';

import { EXAM_OPTIONS } from './examLabels';

export type ExamModeSwitcherProps = {
  value: ExamType | null;
  onChange: (exam: ExamType) => void;
  disabled?: boolean;
};

/**
 * Compact LGS / YGS / KPSS mode control for home header (US7).
 * Changing mode updates users.examType → solve prompts + topic catalog.
 */
export function ExamModeSwitcher({ value, onChange, disabled }: ExamModeSwitcherProps) {
  return (
    <View style={styles.row} testID="exam-mode-switcher" accessibilityRole="toolbar">
      {EXAM_OPTIONS.map((opt) => {
        const selected = value === opt.id;
        return (
          <Pressable
            key={opt.id}
            testID={`exam-mode-${opt.id}`}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled: Boolean(disabled) }}
            disabled={disabled}
            style={[styles.chip, selected && styles.chipOn]}
            onPress={() => onChange(opt.id)}>
            <Text style={[styles.label, selected && styles.labelOn]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space.sm,
    alignSelf: 'stretch',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    minWidth: 72,
    alignItems: 'center',
  },
  chipOn: {
    borderColor: colors.orange,
    backgroundColor: colors.navy,
  },
  label: {
    fontFamily: typography.fontFamily,
    fontWeight: typography.captionWeight,
    fontSize: 14,
    color: colors.navy,
  },
  labelOn: {
    color: colors.white,
  },
});
