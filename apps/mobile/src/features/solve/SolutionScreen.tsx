import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { SolutionStep } from '@/src/lib/api/types';
import { SAFETY_MESSAGES } from '@/src/lib/safetyMessages';
import { colors, radii, space } from '@/src/theme';

export type SolutionScreenProps = {
  steps: SolutionStep[];
  transparencyNote?: string;
  imageUri?: string | null;
};

export function SolutionScreen({
  steps,
  transparencyNote = SAFETY_MESSAGES.transparency,
  imageUri,
}: SolutionScreenProps) {
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
});
