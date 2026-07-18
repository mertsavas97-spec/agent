import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';

import { topicsForExam } from '@/src/data';
import { ExamModeSwitcher } from '@/src/features/exam/ExamModeSwitcher';
import { EXAM_LABEL } from '@/src/features/exam/examLabels';
import { callUpdateExamType } from '@/src/features/exam/updateExamClient';
import { ensureSignedIn } from '@/src/lib/auth';
import { getFirebase } from '@/src/lib/firebase';
import type { ExamType } from '@/src/lib/api/types';
import { colors, space } from '@/src/theme';

export default function ProfileScreen() {
  const [examType, setExamType] = useState<ExamType | null>(null);
  const [switching, setSwitching] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void (async () => {
        try {
          const user = await ensureSignedIn();
          const { db } = getFirebase();
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (!alive || !snap.exists()) return;
          const et = snap.data().examType;
          if (et === 'lgs' || et === 'ygs' || et === 'kpss') setExamType(et);
        } catch {
          /* emulator / offline */
        }
      })();
      return () => {
        alive = false;
      };
    }, []),
  );

  async function onExamChange(next: ExamType) {
    if (next === examType || switching) return;
    setSwitching(true);
    const previous = examType;
    setExamType(next);
    try {
      await callUpdateExamType(next);
    } catch {
      setExamType(previous);
      Alert.alert('Sınav değiştirilemedi', 'Bağlantını kontrol edip tekrar dene.');
    } finally {
      setSwitching(false);
    }
  }

  const catalogCount = examType ? topicsForExam(examType).length : 0;

  return (
    <View style={styles.container} testID="profile-screen">
      <Text style={styles.title}>Profil</Text>
      <Text style={styles.meta} testID="profile-exam">
        Aktif sınav: {examType ? EXAM_LABEL[examType] : '—'}
      </Text>
      <ExamModeSwitcher
        value={examType}
        onChange={(e) => void onExamChange(e)}
        disabled={switching}
      />
      <Text style={styles.meta}>Günlük hak: 5 (ücretsiz)</Text>
      <Text style={styles.meta} testID="topic-catalog-count">
        Bu sınavın konu kataloğu: {catalogCount} başlık
      </Text>
      <Text style={styles.note}>
        Sınav değiştirmek geçmiş kayıtları silmez; yeni çözümler seçili moda göre üretilir.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: space.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: space.md,
  },
  meta: {
    color: colors.textSecondary,
    marginBottom: space.sm,
  },
  note: {
    marginTop: space.md,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
});
