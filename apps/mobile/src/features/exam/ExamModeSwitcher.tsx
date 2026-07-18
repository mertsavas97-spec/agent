import { StyleSheet, Text, View } from 'react-native';

import type { ExamType } from '@/src/lib/api/types';
import { colors, radii, shadows, space, typography } from '@/src/theme';
import { SegmentedTabs } from '@/src/ui/SegmentedTabs';

import { EXAM_OPTIONS } from './examLabels';

export type ExamModeSwitcherProps = {
  value: ExamType | null;
  onChange: (exam: ExamType) => void;
  disabled?: boolean;
};

/**
 * Premium LGS / YGS / KPSS mode control (US7).
 * Labeled so it’s clearly “which exam you’re studying for”.
 */
export function ExamModeSwitcher({ value, onChange, disabled }: ExamModeSwitcherProps) {
  return (
    <View style={styles.card} testID="exam-mode-switcher-wrap">
      <Text style={styles.kicker}>Sınavın</Text>
      <Text style={styles.help}>Hangi sınava hazırlanıyorsun? Konular ve çözüm dili buna göre.</Text>
      <SegmentedTabs
        testID="exam-mode-switcher"
        itemTestIDPrefix="exam-mode"
        value={value}
        disabled={disabled}
        onChange={onChange}
        items={EXAM_OPTIONS.map((o) => ({
          id: o.id,
          label: o.label,
          caption: o.short,
        }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: space.md,
    marginBottom: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  kicker: {
    fontFamily: typography.fontFamily,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.orange,
    marginBottom: 4,
  },
  help: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: space.md,
    lineHeight: 18,
  },
});
