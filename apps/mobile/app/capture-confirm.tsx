import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';

import { EXAM_LABEL } from '@/src/features/exam/examLabels';
import { examThemeFor } from '@/src/features/exam/examTheme';
import { isExamType } from '@/src/features/exam/examTypes';
import { peekPendingSolveImage } from '@/src/features/solve/pendingSolveImageStore';
import type { ExamType } from '@/src/lib/api/types';
import { TR_EYEBROW, trUpper } from '@/src/lib/trCase';
import { colors, radii, shadows, space, typography } from '@/src/theme';
import { Button } from '@/src/ui/Button';
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

  const pending = peekPendingSolveImage();
  const uri =
    pending?.uri || (typeof params.uri === 'string' ? params.uri : '');
  const mimeType = pending?.mimeType || params.mimeType || 'image/jpeg';
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
        mimeType,
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
        <Button label="Geri dön" variant="secondary" onPress={() => router.back()} />
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

      <View
        style={[styles.frame, { borderColor: theme.accent }]}
        testID="capture-confirm-frame">
        <Image
          source={{ uri }}
          style={styles.image}
          resizeMode="contain"
          accessibilityLabel="Seçilen soru fotoğrafı"
        />
        <View style={[styles.corner, styles.cornerTL]} testID="capture-crop-tl" />
        <View style={[styles.corner, styles.cornerTR]} testID="capture-crop-tr" />
        <View style={[styles.corner, styles.cornerBL]} testID="capture-crop-bl" />
        <View style={[styles.corner, styles.cornerBR]} testID="capture-crop-br" />
      </View>
      <Text style={styles.cropHint} testID="capture-crop-hint">
        Soruyu köşe çerçevelerinin içinde tut; bulanık veya kesik metin yeniden seç.
      </Text>

      <Button
        testID="capture-confirm-solve"
        label="Evet, çöz"
        onPress={goSolve}
        style={styles.primaryBtn}
        haptic="medium"
      />

      <Button
        testID="capture-confirm-retake"
        label="Yeniden seç"
        variant="secondary"
        onPress={retake}
        style={styles.secondaryBtn}
      />
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
  frame: {
    flex: 1,
    minHeight: 280,
    backgroundColor: colors.navyDeep,
    borderRadius: radii.lg,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: space.sm,
    position: 'relative',
    ...shadows.raised,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: colors.orange,
  },
  cornerTL: {
    top: 12,
    left: 12,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTR: {
    top: 12,
    right: 12,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBL: {
    bottom: 12,
    left: 12,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBR: {
    bottom: 12,
    right: 12,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  cropHint: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginBottom: space.md,
  },
  primaryBtn: {
    marginTop: space.md,
  },
  secondaryBtn: {
    marginTop: space.sm,
  },
});
