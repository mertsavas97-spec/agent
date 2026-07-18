import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { SolutionStep } from '@/src/lib/api/types';
import { SAFETY_MESSAGES } from '@/src/lib/safetyMessages';
import { colors, radii, space } from '@/src/theme';

export type SolutionScreenProps = {
  steps: SolutionStep[];
  transparencyNote?: string;
  imageUri?: string | null;
  solutionId?: string | null;
  onExplainAgain?: () => Promise<string>;
};

export function SolutionScreen({
  steps,
  transparencyNote = SAFETY_MESSAGES.transparency,
  imageUri,
  solutionId,
  onExplainAgain,
}: SolutionScreenProps) {
  const [followUp, setFollowUp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExplain() {
    if (!onExplainAgain) return;
    setLoading(true);
    setError(null);
    try {
      const text = await onExplainAgain();
      setFollowUp(text);
    } catch {
      setError('Açıklama şu an üretilemedi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="solution-screen">
      <Text style={styles.heading}>Çözüm</Text>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.thumb} resizeMode="cover" />
      ) : null}
      {steps.map((step, index) => (
        <View key={`${index}-${step.title ?? ''}`} style={styles.card} testID={`step-${index}`}>
          <Text style={styles.stepTitle}>{step.title ?? `${index + 1}. Adım`}</Text>
          <Text style={styles.stepBody}>{step.body}</Text>
        </View>
      ))}
      <Text style={styles.note} testID="transparency-note">
        {transparencyNote}
      </Text>

      {solutionId && onExplainAgain ? (
        <Pressable
          style={styles.explainBtn}
          onPress={() => void handleExplain()}
          disabled={loading}
          testID="explain-again-btn">
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.explainLabel}>Anlamadım, tekrar açıkla</Text>
          )}
        </Pressable>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {followUp ? (
        <View style={styles.followUp} testID="follow-up-text">
          <Text style={styles.followTitle}>Daha sade anlatım</Text>
          <Text style={styles.stepBody}>{followUp}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: space.lg, paddingBottom: space.xl * 2 },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: space.md,
  },
  thumb: {
    width: '100%',
    height: 140,
    borderRadius: radii.md,
    marginBottom: space.md,
    backgroundColor: colors.border,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: space.md,
    marginBottom: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepTitle: {
    fontWeight: '700',
    color: colors.navy,
    marginBottom: space.xs,
  },
  stepBody: {
    color: colors.textPrimary,
    lineHeight: 22,
  },
  note: {
    marginTop: space.md,
    fontSize: 12,
    color: colors.textSecondary,
  },
  explainBtn: {
    marginTop: space.lg,
    backgroundColor: colors.navy,
    borderRadius: radii.md,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  explainLabel: {
    color: colors.white,
    fontWeight: '700',
  },
  followUp: {
    marginTop: space.md,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: space.md,
    borderColor: colors.orange,
    borderWidth: 1,
  },
  followTitle: {
    fontWeight: '700',
    color: colors.orange,
    marginBottom: space.sm,
  },
  error: {
    marginTop: space.sm,
    color: colors.danger,
  },
});
