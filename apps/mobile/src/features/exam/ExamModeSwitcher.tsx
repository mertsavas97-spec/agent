import { StyleSheet, Text, View } from 'react-native';

import type { ExamType } from '@/src/lib/api/types';
import { TR_EYEBROW } from '@/src/lib/trCase';
import { colors, radii, shadows, space, typography } from '@/src/theme';
import { Eyebrow } from '@/src/ui/Eyebrow';
import { SegmentedTabs } from '@/src/ui/SegmentedTabs';

import { EXAM_OPTIONS } from './examLabels';
import { EXAM_THEME, examThemeFor } from './examTheme';

export type ExamModeSwitcherProps = {
  value: ExamType | null;
  onChange: (exam: ExamType) => void;
  disabled?: boolean;
};

/** LGS / YGS / KPSS / Ehliyet — labeled exam mode with per-exam color + MOD chip. */
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
              borderWidth: 2,
            }
          : null,
      ]}
      testID="exam-mode-switcher-wrap">
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Eyebrow style={[styles.kicker, theme ? { color: theme.solid } : null]}>
            {TR_EYEBROW.activeExamMode}
          </Eyebrow>
          <Text style={styles.help}>
            LGS, YGS, KPSS veya Ehliyet seç; çözüm dili, konular ve istatistikler buna göre
            ayarlanır.
          </Text>
        </View>
        {theme ? (
          <View
            style={[styles.modeChip, { backgroundColor: theme.solid }]}
            testID="exam-mode-chip"
            accessibilityLabel={`Aktif mod ${theme.label}`}>
            <Text style={styles.modeChipText}>{theme.modeChip}</Text>
          </View>
        ) : (
          <View style={[styles.modeChip, styles.modeChipIdle]} testID="exam-mode-chip">
            <Text style={styles.modeChipTextIdle}>MOD: —</Text>
          </View>
        )}
      </View>

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

      {theme ? (
        <Text style={[styles.activeLine, { color: theme.solid }]} testID="exam-mode-active-line">
          Şu an {theme.label} modundasın · {theme.short}
        </Text>
      ) : (
        <Text style={styles.activeLineIdle}>Sınavını seçerek başla</Text>
      )}

      <View style={styles.legendRow} testID="exam-mode-legend">
        {(Object.keys(EXAM_THEME) as ExamType[]).map((id) => {
          const t = EXAM_THEME[id];
          const on = value === id;
          return (
            <View key={id} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: t.solid }]} />
              <Text style={[styles.legendLabel, on && { color: t.solid, fontWeight: '700' }]}>
                {t.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: space.md,
    marginBottom: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    marginBottom: space.md,
  },
  headerText: { flex: 1 },
  kicker: {
    fontSize: 13,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  help: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  modeChip: {
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 88,
    alignItems: 'center',
  },
  modeChipIdle: {
    backgroundColor: colors.navySoft,
  },
  modeChipText: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.4,
  },
  modeChipTextIdle: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.4,
  },
  activeLine: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 13,
    fontWeight: '700',
    marginTop: space.md,
  },
  activeLineIdle: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: space.md,
  },
  legendRow: {
    flexDirection: 'row',
    gap: space.md,
    marginTop: space.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: colors.textSecondary,
  },
});
