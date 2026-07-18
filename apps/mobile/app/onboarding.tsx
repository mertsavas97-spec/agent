import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import {
  OnboardingFlow,
  type OnboardingResult,
} from '@/src/features/onboarding/OnboardingFlow';
import { submitOnboarding } from '@/src/features/onboarding/completeClient';
import { colors, space } from '@/src/theme';

export default function OnboardingScreen() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleComplete(result: OnboardingResult) {
    setSaving(true);
    setError(null);
    try {
      await submitOnboarding(result);
      router.replace('/(tabs)');
    } catch {
      setError('Kayıt tamamlanamadı. Tekrar dene.');
    } finally {
      setSaving(false);
    }
  }

  if (saving) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.navy} size="large" />
        <Text style={styles.saving}>Kaydediliyor…</Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <OnboardingFlow onComplete={(r) => void handleComplete(r)} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
  },
  saving: { marginTop: space.md, color: colors.textSecondary },
  error: {
    position: 'absolute',
    bottom: space.xl,
    alignSelf: 'center',
    color: colors.danger,
  },
});
