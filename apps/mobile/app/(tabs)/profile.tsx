import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';

import { KPSS_TOPICS, LGS_TOPICS, YGS_TOPICS } from '@/src/data';
import { ensureSignedIn } from '@/src/lib/auth';
import { getFirebase } from '@/src/lib/firebase';
import type { ExamType } from '@/src/lib/api/types';
import { colors, space } from '@/src/theme';

const EXAM_LABEL: Record<ExamType, string> = {
  lgs: 'LGS',
  ygs: 'YGS',
  kpss: 'KPSS',
};

export default function ProfileScreen() {
  const topicCount = LGS_TOPICS.length + YGS_TOPICS.length + KPSS_TOPICS.length;
  const [examType, setExamType] = useState<ExamType | null>(null);

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

  return (
    <View style={styles.container} testID="profile-screen">
      <Text style={styles.title}>Profil</Text>
      <Text style={styles.meta} testID="profile-exam">
        Sınav: {examType ? EXAM_LABEL[examType] : '—'} (LGS / YGS / KPSS)
      </Text>
      <Text style={styles.meta}>Günlük hak: 5</Text>
      <Text style={styles.meta} testID="topic-catalog-count">
        Konu kataloğu: {topicCount} başlık
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
});
