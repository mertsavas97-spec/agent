import { StyleSheet, Text, View } from 'react-native';

import type { ExamType } from '@/src/lib/api/types';
import { TR_EYEBROW } from '@/src/lib/trCase';
import { colors, radii, shadows, space, typography } from '@/src/theme';
import { Eyebrow } from '@/src/ui/Eyebrow';
import { SegmentedTabs } from '@/src/ui/SegmentedTabs';

import { EXAM_OPTIONS } from './examLabels';
import { examThemeFor } from './examTheme';

export type ExamModeSwitcherProps = {
  value: ExamType | null;
  onChange: (exam: ExamType) => void;
  disabled?: boolean;
};

/** Compact exam picker with bold mod label + prominent tabs. */
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
              borderWidth: 1.5,
            }
          : null,
      ]}
      testID="exam-mode-switcher-wrap"
      accessibilityLabel={theme ? `Sınav modu: ${theme.label}` : 'Sınav modu seç'}>
      <View style={styles.header}>
        <Eyebrow tone={theme ? 'navy' : 'orange'} style={styles.kicker}>
          {TR_EYEBROW.modPicker}
        </Eyebrow>
        <Text style={styles.title} testID="exam-mode-title">
          Sınav paketini seç
        </Text>
      </View>

      <SegmentedTabs
        testID="exam-mode-switcher"
        itemTestIDPrefix="exam-mode"
        value={value}
        disabled={disabled}
        onChange={onChange}
        prominence="strong"
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
    padding: space.md,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  header: {
    marginBottom: space.sm,
  },
  kicker: {
    fontSize: 11,
    letterSpacing: 0.7,
    marginBottom: 4,
  },
  title: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
  },
  idleHint: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: space.sm,
    marginBottom: 2,
  },
});
