import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { findTopic } from '@/src/data';
import { lessonForTopic } from '@/src/data/topicLessons';
import {
  getLocalHistoryEntry,
  type LocalHistoryEntry,
} from '@/src/features/history/localHistoryStore';
import { SolutionScreen } from '@/src/features/solve/SolutionScreen';
import { colors, space, typography } from '@/src/theme';

export default function HistoryDetailScreen() {
  const router = useRouter();
  const { attemptId } = useLocalSearchParams<{ attemptId?: string }>();
  const [entry, setEntry] = useState<LocalHistoryEntry | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    void (async () => {
      if (!attemptId) {
        if (alive) setEntry(null);
        return;
      }
      const found = await getLocalHistoryEntry(attemptId);
      if (alive) setEntry(found);
    })();
    return () => {
      alive = false;
    };
  }, [attemptId]);

  if (entry === undefined) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Geçmiş' }} />
        <ActivityIndicator color={colors.navy} />
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={styles.center} testID="history-detail-missing">
        <Stack.Screen options={{ title: 'Geçmiş' }} />
        <Text style={styles.missingTitle}>Kayıt açılamadı</Text>
        <Text style={styles.missingBody}>
          Bu çözüm yalnızca bu cihazda saklanmış olabilir veya silinmiş olabilir.
          Yeni bir soru çözdüğünde geçmişe düşer.
        </Text>
      </View>
    );
  }

  const topicMeta = entry.topicId ? findTopic(entry.topicId) : undefined;
  const topicName = topicMeta?.nameTr ?? null;
  const topicLesson = lessonForTopic(
    entry.topicId,
    topicMeta
      ? {
          nameTr: topicMeta.nameTr,
          subject: topicMeta.subject,
          examType: topicMeta.examType,
        }
      : {
          nameTr: topicName ?? 'Konu',
          subject: entry.subject,
          examType: entry.examType,
        },
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Geçmiş çözüm', headerBackTitle: 'Geri' }} />
      <SolutionScreen
        steps={entry.steps}
        answer={entry.answer ?? null}
        transparencyNote={entry.transparencyNote}
        imageUri={entry.imageUri}
        solutionId={null}
        examType={entry.examType}
        subject={entry.subject}
        topicId={entry.topicId}
        topicName={topicName}
        topicLesson={topicLesson}
        onDone={() => router.back()}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: space.lg,
    backgroundColor: colors.surface,
  },
  missingTitle: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 18,
    color: colors.navy,
    marginBottom: space.sm,
    textAlign: 'center',
  },
  missingBody: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
