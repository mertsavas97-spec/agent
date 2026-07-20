import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { examThemeFor, type ExamTheme } from '@/src/features/exam/examTheme';
import { resolveActiveExamType } from '@/src/features/exam/resolveActiveExam';
import type { ExamType } from '@/src/lib/api/types';

/**
 * Active exam package from onboarding / Settings preference.
 * Screens should lock catalog & stats to this — no cross-exam browsing.
 */
export function useActiveExam(fallback: ExamType = 'lgs'): {
  examType: ExamType;
  theme: ExamTheme;
  ready: boolean;
} {
  const [examType, setExamType] = useState<ExamType>(fallback);
  const [ready, setReady] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void (async () => {
        try {
          const resolved = await resolveActiveExamType();
          if (!alive) return;
          setExamType(resolved.examType);
        } catch {
          if (!alive) return;
          setExamType(fallback);
        } finally {
          if (alive) setReady(true);
        }
      })();
      return () => {
        alive = false;
      };
    }, [fallback]),
  );

  return {
    examType,
    theme: examThemeFor(examType)!,
    ready,
  };
}
