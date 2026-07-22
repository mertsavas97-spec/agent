import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EXAM_LABEL, EXAM_SHORT } from '@/src/features/exam/examLabels';
import { examThemeFor } from '@/src/features/exam/examTheme';
import type { ExamType } from '@/src/lib/api/types';
import { TR_EYEBROW } from '@/src/lib/trCase';
import { colors, radii, shadows, space, typography } from '@/src/theme';
import { CozbilRobot } from '@/src/ui/CozbilRobot';
import { Eyebrow } from '@/src/ui/Eyebrow';
import { hapticMedium, hapticSelection } from '@/src/ui/haptics';

export type ExamModeBlockScreenProps = {
  activeExam: ExamType;
  detectedExam: ExamType;
  headline?: string;
  message?: string;
  switching?: boolean;
  onSwitchMode: () => void;
  onGoBack: () => void;
};

/**
 * Premium full-screen gate — wrong exam package detected.
 * Never shows solution steps; user must switch mode or leave.
 */
export function ExamModeBlockScreen({
  activeExam,
  detectedExam,
  headline,
  message,
  switching,
  onSwitchMode,
  onGoBack,
}: ExamModeBlockScreenProps) {
  const activeTheme = examThemeFor(activeExam);
  const detectedTheme = examThemeFor(detectedExam);

  const title =
    headline ?? `Bu soru ${EXAM_LABEL[detectedExam]} sınavına ait görünüyor`;
  const body =
    message ??
    `Şu an ${EXAM_LABEL[activeExam]} modundasın. Yanlış pakette çözüm göstermiyoruz — modu değiştir veya başka bir fotoğraf dene.`;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.root}
      testID="exam-mode-block-screen"
      showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <CozbilRobot size={52} animate tone="onDark" testID="exam-block-robot" />
          <View style={styles.heroTitles}>
            <Eyebrow tone="orange">{TR_EYEBROW.modPicker}</Eyebrow>
            <Text style={styles.kicker}>Sınav paketi uyuşmuyor</Text>
          </View>
          <SymbolView
            name={{
              ios: 'exclamationmark.triangle.fill',
              android: 'warning',
              web: 'warning',
            }}
            tintColor={colors.orange}
            size={24}
          />
        </View>
        <Text style={styles.headline} testID="exam-block-headline">
          {title}
        </Text>
        <Text style={styles.support} testID="exam-block-body">
          {body}
        </Text>
      </View>

      <View style={styles.cards}>
        <View
          style={[
            styles.modeCard,
            activeTheme
              ? { backgroundColor: activeTheme.soft, borderColor: activeTheme.accent }
              : null,
          ]}
          testID="exam-block-active-card">
          <Text style={styles.modeLabel}>Şu anki mod</Text>
          <Text style={[styles.modeValue, activeTheme ? { color: activeTheme.solid } : null]}>
            {EXAM_LABEL[activeExam]}
          </Text>
          <Text style={styles.modeHint}>{EXAM_SHORT[activeExam]}</Text>
        </View>

        <View style={styles.arrowWrap}>
          <SymbolView
            name={{ ios: 'arrow.down', android: 'south', web: 'south' }}
            tintColor={colors.textMuted}
            size={18}
          />
        </View>

        <View
          style={[
            styles.modeCard,
            styles.modeCardDetected,
            detectedTheme
              ? { backgroundColor: detectedTheme.soft, borderColor: detectedTheme.accent }
              : null,
          ]}
          testID="exam-block-detected-card">
          <Text style={styles.modeLabel}>Sorunun ait olduğu paket</Text>
          <Text
            style={[styles.modeValue, detectedTheme ? { color: detectedTheme.solid } : null]}>
            {EXAM_LABEL[detectedExam]}
          </Text>
          <Text style={styles.modeHint}>{EXAM_SHORT[detectedExam]}</Text>
        </View>
      </View>

      <Pressable
        testID="exam-block-switch"
        accessibilityRole="button"
        accessibilityLabel={`${EXAM_LABEL[detectedExam]} moduna geç`}
        style={[styles.primary, switching && styles.primaryDisabled]}
        disabled={switching}
        onPress={() => {
          void hapticMedium();
          onSwitchMode();
        }}>
        <Text style={styles.primaryText}>
          {switching ? 'Mod değiştiriliyor…' : `${EXAM_LABEL[detectedExam]} moduna geç`}
        </Text>
      </Pressable>

      <Pressable
        testID="exam-block-back"
        accessibilityRole="button"
        style={styles.secondary}
        onPress={() => {
          void hapticSelection();
          onGoBack();
        }}>
        <Text style={styles.secondaryText}>Ana sayfaya dön</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  root: {
    flexGrow: 1,
    paddingHorizontal: space.lg,
    paddingTop: space.xl,
    paddingBottom: space.xl,
    gap: space.lg,
  },
  hero: {
    borderRadius: radii.xl,
    padding: space.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    ...shadows.soft,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginBottom: space.md,
  },
  heroTitles: {
    flex: 1,
    gap: 4,
  },
  kicker: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 18,
    color: colors.white,
  },
  headline: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 24,
    lineHeight: 30,
    color: colors.white,
    marginBottom: space.sm,
  },
  support: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.78)',
  },
  cards: {
    gap: space.sm,
  },
  modeCard: {
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: space.md,
    ...shadows.soft,
  },
  modeCardDetected: {
    borderWidth: 2,
  },
  modeLabel: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  modeValue: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 22,
    color: colors.navy,
  },
  modeHint: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  arrowWrap: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  primary: {
    backgroundColor: colors.orange,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
    ...shadows.cta,
  },
  primaryDisabled: {
    opacity: 0.7,
  },
  primaryText: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 16,
    color: colors.navy,
  },
  secondary: {
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  secondaryText: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 15,
    color: colors.white,
  },
});
