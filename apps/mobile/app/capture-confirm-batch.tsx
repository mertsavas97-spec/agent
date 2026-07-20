import { Stack, useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EXAM_LABEL } from '@/src/features/exam/examLabels';
import { examThemeFor } from '@/src/features/exam/examTheme';
import { isExamType } from '@/src/features/exam/examTypes';
import {
  clearPendingMultiBatch,
  peekPendingMultiBatch,
} from '@/src/features/solve/multiBatchStore';
import type { ExamType } from '@/src/lib/api/types';
import { trUpper } from '@/src/lib/trCase';
import { colors, radii, shadows, space, typography } from '@/src/theme';
import { Eyebrow } from '@/src/ui/Eyebrow';

/**
 * Preview after multi-select — user confirms before batch solve starts.
 */
export default function CaptureConfirmBatchScreen() {
  const router = useRouter();
  const batch = peekPendingMultiBatch();
  const images = batch?.images ?? [];
  const examType: ExamType =
    batch?.examType && isExamType(batch.examType) ? batch.examType : 'lgs';
  const theme = examThemeFor(examType)!;

  function goSolve() {
    if (images.length === 0) return;
    router.replace('/solve-batch');
  }

  function retake() {
    clearPendingMultiBatch();
    router.back();
  }

  if (images.length === 0) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Fotoğraf seçilmedi.</Text>
        <Pressable onPress={() => router.back()} style={styles.secondaryBtn}>
          <Text style={styles.secondaryText}>Geri dön</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.soft }]} testID="capture-confirm-batch">
      <Stack.Screen
        options={{
          title: 'Fotoğrafları kontrol et',
          headerStyle: { backgroundColor: theme.solid },
          headerTintColor: '#fff',
        }}
      />

      <Eyebrow style={[styles.kicker, { color: theme.solid }]}>
        {trUpper(`Galeriden · ${images.length} soru · ${EXAM_LABEL[examType]}`)}
      </Eyebrow>
      <Text style={styles.title}>Bu fotoğraflarla devam edilsin mi?</Text>
      <Text style={styles.hint}>
        Her karede soru metni ve şıklar net görünsün. Değilse yeniden seç.
      </Text>

      <ScrollView
        style={styles.gridScroll}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}>
        {images.map((img, i) => (
          <View
            key={`${img.uri}-${i}`}
            style={[styles.thumbWrap, { borderColor: theme.accent }]}
            testID={`capture-batch-thumb-${i}`}>
            <Text style={[styles.thumbLabel, { color: theme.solid }]}>Soru {i + 1}</Text>
            <Image
              source={{ uri: img.uri }}
              style={styles.thumb}
              resizeMode="cover"
              accessibilityLabel={`Seçilen soru ${i + 1}`}
            />
          </View>
        ))}
      </ScrollView>

      <Pressable
        testID="capture-batch-confirm-solve"
        style={styles.primaryBtn}
        onPress={goSolve}>
        <Text style={styles.primaryText}>Evet, çöz ({images.length})</Text>
      </Pressable>

      <Pressable
        testID="capture-batch-retake"
        style={[styles.secondaryBtn, { borderColor: theme.solid }]}
        onPress={retake}>
        <Text style={[styles.secondaryText, { color: theme.solid }]}>Yeniden seç</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: space.lg,
    paddingBottom: space.xl,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
    backgroundColor: colors.surface,
  },
  missingText: {
    fontFamily: typography.fontFamily,
    color: colors.textSecondary,
    marginBottom: space.md,
  },
  kicker: {
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  title: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 22,
    fontWeight: '700',
    color: colors.navy,
    letterSpacing: -0.3,
  },
  hint: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: space.md,
    lineHeight: 22,
  },
  gridScroll: {
    flex: 1,
    marginBottom: space.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    paddingBottom: space.sm,
  },
  thumbWrap: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 2,
    overflow: 'hidden',
    ...shadows.soft,
  },
  thumbLabel: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 4,
  },
  thumb: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: colors.navySoft,
  },
  primaryBtn: {
    backgroundColor: colors.orange,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: space.sm,
    ...shadows.cta,
  },
  primaryText: {
    fontFamily: typography.fontFamilySemiBold,
    color: colors.navy,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  secondaryText: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 15,
    fontWeight: '700',
    color: colors.navy,
  },
});
