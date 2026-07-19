import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { findItem } from '@/src/data/itemBank';
import { findTopic } from '@/src/data';
import { colors, radii, space, typography } from '@/src/theme';

export default function SampleItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = typeof id === 'string' ? findItem(id) : undefined;
  const topic = item ? findTopic(item.topicId) : undefined;

  if (!item) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Örnek soru bulunamadı.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      testID="sample-item-screen">
      <Text style={styles.kicker}>
        {topic?.nameTr ?? 'Konu'} · örnek soru
      </Text>
      <Text style={styles.stem}>{item.stem}</Text>

      <Text style={styles.section}>Şıklar</Text>
      {(['A', 'B', 'C', 'D', 'E'] as const).map((key) => {
        const correct = key === item.answerKey;
        return (
          <View key={key} style={[styles.choice, correct && styles.choiceOn]}>
            <Text style={[styles.choiceKey, correct && styles.choiceKeyOn]}>{key}</Text>
            <Text style={[styles.choiceBody, correct && styles.choiceBodyOn]}>
              {item.choices[key]}
            </Text>
          </View>
        );
      })}

      <Text style={styles.section}>Adım adım anlatım</Text>
      {item.explanationSteps.map((step, idx) => (
        <View key={`${step.title}-${idx}`} style={styles.step}>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepBody}>{step.body}</Text>
        </View>
      ))}

      <Text style={styles.note}>{item.transparencyNote}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { padding: space.lg, paddingBottom: space.xl * 2 },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  missingText: { color: colors.textSecondary },
  kicker: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.orange,
    marginBottom: space.sm,
  },
  stem: {
    fontFamily: typography.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: colors.navy,
    lineHeight: 26,
    marginBottom: space.lg,
  },
  section: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: space.sm,
    marginTop: space.sm,
  },
  choice: {
    flexDirection: 'row',
    gap: space.sm,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: space.md,
    marginBottom: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  choiceOn: {
    borderColor: colors.orange,
    backgroundColor: colors.orangeSoft,
  },
  choiceKey: {
    fontFamily: typography.fontFamily,
    fontWeight: '700',
    color: colors.navy,
    width: 20,
  },
  choiceKeyOn: { color: colors.orange },
  choiceBody: {
    fontFamily: typography.fontFamily,
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
  },
  choiceBodyOn: { fontWeight: '600' },
  step: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: space.md,
    marginBottom: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepTitle: {
    fontFamily: typography.fontFamily,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 4,
  },
  stepBody: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  note: {
    fontFamily: typography.fontFamily,
    marginTop: space.md,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
});
