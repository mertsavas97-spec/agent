import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  OnboardingFlow,
  type OnboardingResult,
} from '@/src/features/onboarding/OnboardingFlow';
import { submitOnboarding } from '@/src/features/onboarding/completeClient';
import { examThemeFor } from '@/src/features/exam/examTheme';
import { colors, space, typography } from '@/src/theme';
import { CozbilRobot } from '@/src/ui/CozbilRobot';

export default function OnboardingScreen() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingExam, setSavingExam] = useState<OnboardingResult['examType'] | null>(null);

  async function handleComplete(result: OnboardingResult) {
    setSaving(true);
    setSavingExam(result.examType);
    setError(null);
    try {
      await submitOnboarding(result);
      try {
        router.replace('/(tabs)');
      } catch {
        // BootstrapGate also navigates when gate becomes ready.
      }
    } catch {
      setError('Kayıt tamamlanamadı. İnterneti kontrol edip tekrar dene.');
      setSaving(false);
      setSavingExam(null);
    }
  }

  const savingTheme = examThemeFor(savingExam);

  if (saving) {
    return (
      <SafeAreaView
        style={[
          styles.center,
          savingTheme ? { backgroundColor: savingTheme.soft } : null,
        ]}
        testID="onboarding-saving">
        <CozbilRobot
          size={88}
          animate
          tone="onLight"
          testID="onboarding-saving-robot"
        />
        <ActivityIndicator
          color={savingTheme?.solid ?? colors.navy}
          size="large"
          style={styles.spinner}
        />
        <Text style={[styles.savingTitle, savingTheme ? { color: savingTheme.solid } : null]}>
          Hazırlanıyor…
        </Text>
        <Text style={styles.savingBody}>Modun kaydediliyor, ana sayfaya yönlendiriliyorsun.</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.flex}>
      <OnboardingFlow onComplete={(r) => void handleComplete(r)} />
      {error ? (
        <SafeAreaView edges={['bottom']} style={styles.errorWrap}>
          <Text style={styles.error} testID="onboarding-error">
            {error}
          </Text>
        </SafeAreaView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: space.xl,
  },
  spinner: { marginTop: space.lg },
  savingTitle: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 20,
    fontWeight: '700',
    color: colors.navy,
    marginTop: space.md,
  },
  savingBody: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: space.sm,
    lineHeight: 20,
  },
  errorWrap: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    bottom: space.md,
  },
  error: {
    textAlign: 'center',
    color: colors.danger,
    fontFamily: typography.fontFamilyMedium,
    fontSize: 14,
    backgroundColor: colors.white,
    padding: space.md,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
