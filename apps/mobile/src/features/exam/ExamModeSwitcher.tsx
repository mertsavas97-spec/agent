import { StyleSheet, Text, View } from 'react-native';

import type { ExamType } from '@/src/lib/api/types';
import { colors, radii, shadows, space, typography } from '@/src/theme';
import { SegmentedTabs } from '@/src/ui/SegmentedTabs';

import { EXAM_OPTIONS } from './examLabels';
import { examThemeFor } from './examTheme';

export type ExamModeSwitcherProps = {
  value: ExamType | null;
  onChange: (exam: ExamType) => void;
  disabled?: boolean;
};

/**
 * Compact exam picker — selection IS the signal.
 * No help copy, MOD chip, legend, or “şu an … modundasın” (home redesign v2).
 */
export function ExamModeSwitcher({ value, onChange, disabled }: ExamModeSwitcherProps) {
  const theme = examThemeFor(value);

  return (
    <View
      style={[
        styles.card,
        theme
          ? {
              backgroundColor: theme.soft,
              borderColor: theme.accent,
              borderWidth: 1,
            }
          : null,
      ]}
      testID="exam-mode-switcher-wrap"
      accessibilityLabel={theme ? `Sınav: ${theme.label}` : 'Sınav seç'}>
      <SegmentedTabs
        testID="exam-mode-switcher"
        itemTestIDPrefix="exam-mode"
        value={value}
        disabled={disabled}
        onChange={onChange}
        activeColor={theme?.solid ?? colors.navy}
        accentColor={theme?.accent ?? colors.orange}
        items={EXAM_OPTIONS.map((o) => ({
          id: o.id,
          label: o.label,
          caption: o.short,
        }))}
      />

      {!value ? (
        <Text style={styles.idleHint} testID="exam-mode-idle-hint">
          Sınavını seç
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: space.sm,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  idleHint: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: space.sm,
    marginBottom: 4,
  },
});
