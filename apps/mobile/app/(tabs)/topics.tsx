import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { doc, getDoc } from 'firebase/firestore';

import { EXAM_LABEL } from '@/src/features/exam/examLabels';
import { itemsForExam } from '@/src/data/itemBank';
import type { ExamType } from '@/src/lib/api/types';
import { ensureSignedIn } from '@/src/lib/auth';
import { getFirebase } from '@/src/lib/firebase';
import { findTopic } from '@/src/data';
import { colors, radii, shadows, space, typography } from '@/src/theme';
import { EmptyState } from '@/src/ui/EmptyState';

export default function TopicsScreen() {
  const router = useRouter();
  const [examType, setExamType] = useState<ExamType>('lgs');

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void (async () => {
        try {
          const user = await ensureSignedIn();
          const snap = await getDoc(doc(getFirebase().db, 'users', user.uid));
          const et = snap.data()?.examType;
          if (!alive) return;
          if (et === 'lgs' || et === 'ygs' || et === 'kpss') setExamType(et);
        } catch {
          /* keep default */
        }
      })();
      return () => {
        alive = false;
      };
    }, []),
  );

  const items = useMemo(() => itemsForExam(examType), [examType]);

  return (
    <View style={styles.container} testID="topics-screen">
      <Text style={styles.eyebrow}>Öğren</Text>
      <Text style={styles.title}>Konular</Text>
      <Text style={styles.subtitle}>
        {EXAM_LABEL[examType]} için örnek soru ve adım adım anlatım. Ana sayfadan sınavını
        değiştirebilirsin.
      </Text>

      {items.length === 0 ? (
        <EmptyState
          title="Bu sınavda örnek henüz yok"
          subtitle="Yakında yeni telifsiz örnekler eklenecek."
        />
      ) : (
        <FlatList
          testID="topics-list"
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const topic = findTopic(item.topicId);
            return (
              <Pressable
                style={styles.card}
                testID={`topic-item-${item.id}`}
                accessibilityRole="button"
                onPress={() =>
                  router.push({ pathname: '/sample/[id]', params: { id: item.id } })
                }>
                <Text style={styles.cardKicker}>
                  {item.subject === 'math' ? 'Matematik' : 'Türkçe'}
                  {topic ? ` · ${topic.nameTr}` : ''}
                </Text>
                <Text style={styles.cardTitle} numberOfLines={3}>
                  {item.stem}
                </Text>
                <Text style={styles.cardCta}>Örnek çözümü gör →</Text>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
  },
  eyebrow: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.orange,
    marginBottom: 4,
  },
  title: {
    fontFamily: typography.fontFamily,
    fontSize: 28,
    fontWeight: '700',
    color: colors.navy,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: space.lg,
    lineHeight: 20,
  },
  list: { paddingBottom: space.xl },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: space.md,
    marginBottom: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  cardKicker: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: colors.orange,
    marginBottom: 6,
  },
  cardTitle: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    fontWeight: '600',
    color: colors.navy,
    lineHeight: 22,
  },
  cardCta: {
    fontFamily: typography.fontFamily,
    marginTop: space.md,
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
  },
});
