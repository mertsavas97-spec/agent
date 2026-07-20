import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { EXAM_LABEL } from '@/src/features/exam/examLabels';
import { examThemeFor } from '@/src/features/exam/examTheme';
import { isExamType } from '@/src/features/exam/examTypes';
import type { ExamType } from '@/src/lib/api/types';
import { TR_EYEBROW, trUpper } from '@/src/lib/trCase';
import { colors, radii, shadows, space, typography } from '@/src/theme';
import { Eyebrow } from '@/src/ui/Eyebrow';

/**
 * Preview after camera/gallery — user confirms before solve loading starts.
 */
export default function CaptureConfirmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    uri?: string;
    mimeType?: string;
    source?: string;
    examType?: string;
    subjectHint?: string;
  }>();

  const uri = typeof params.uri === 'string' ? params.uri : '';
  const examType: ExamType = isExamType(params.examType) ? params.examType : 'lgs';
  const theme = examThemeFor(examType)!;
  const sourceLabel =
    params.source === 'camera' ? TR_EYEBROW.fromCamera : TR_EYEBROW.fromGallery;

  function goSolve() {
    if (!uri) return;
    router.replace({
      pathname: '/solve',
      params: {
        uri,
        mimeType: params.mimeType ?? 'image/jpeg',
        source: params.source ?? 'library',
        examType,
        ...(params.subjectHint ? { subjectHint: params.subjectHint } : {}),
      },
    });
  }

  function retake() {
    router.back();
  }

  if (!uri) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Fotoğraf bulunamadı.</Text>
        <Pressable onPress={() => router.back()} style={styles.secondaryBtn}>
          <Text style={styles.secondaryText}>Geri dön</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.soft }]} testID="capture-confirm">
      <Stack.Screen
        options={{
          title: 'Fotoğrafı kontrol et',
          headerStyle: { backgroundColor: theme.solid },
          headerTintColor: '#fff',
        }}
      />

      <Eyebrow style={[styles.kicker, { color: theme.solid }]}>
        {`${sourceLabel} · ${trUpper(EXAM_LABEL[examType])}`}
      </Eyebrow>
      <Text style={styles.title}>Bu fotoğrafla devam edilsin mi?</Text>
      <Text style={styles.hint}>
        Soru metni ve şıklar net görünsün. Değilse yeniden seç.
      </Text>

      <View style={[styles.frame, { borderColor: theme.accent }]}>
        <Image
          source={{ uri }}
          style={styles.image}
          resizeMode="contain"
          accessibilityLabel="Seçilen soru fotoğrafı"
        />
      </View>

      <Pressable
        testID="capture-confirm-solve"
        style={[styles.primaryBtn, { backgroundColor: theme.solid }]}
        onPress={goSolve}>
        <Text style={styles.primaryText}>Evet, çöz</Text>
      </Pressable>

      <Pressable
        testID="capture-confirm-retake"
        style={[styles.secondaryBtn, { borderColor: theme.solid }]}
        onPress={retake}>
        <Text style={[styles.secondaryText, { color: theme.solid }]}>
          Yeniden seç
        </Text>
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
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: space.md,
    lineHeight: 20,
  },
  frame: {
    flex: 1,
    minHeight: 280,
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: space.lg,
    ...shadows.soft,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  primaryBtn: {
    borderRadius: radii.xl,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: space.sm,
  },
  primaryText: {
    fontFamily: typography.fontFamilySemiBold,
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    borderRadius: radii.xl,
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
