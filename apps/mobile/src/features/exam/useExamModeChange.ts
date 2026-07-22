import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import {
  hydrateEntitlement,
  type EntitlementSnapshot,
} from '@/src/features/paywall/entitlement';
import type { ExamType } from '@/src/lib/api/types';

import { setExamPreferenceCache } from './examPreferenceCache';
import { callUpdateExamType } from './updateExamClient';
import { hapticSelection } from '@/src/ui/haptics';

export type UseExamModeChangeOptions = {
  ent?: EntitlementSnapshot | null;
  /** Optimistic UI — called before network. */
  onOptimistic?: (next: ExamType) => void;
};

/**
 * Shared exam switch — optimistic local preference, background sync.
 * Exam package is information architecture (not a paywall gate): free users
 * switch immediately; ads stay on solve quota / multi-batch unlocks.
 */
export function useExamModeChange(options: UseExamModeChangeOptions = {}) {
  const [switching, setSwitching] = useState(false);
  const onOptimistic = options.onOptimistic;

  const applyExam = useCallback(
    async (next: ExamType) => {
      setSwitching(true);
      try {
        setExamPreferenceCache(next);
        onOptimistic?.(next);
        void hapticSelection();
        await callUpdateExamType(next);
      } catch {
        Alert.alert('Sınav değiştirilemedi', 'Bağlantını kontrol edip tekrar dene.');
      } finally {
        setSwitching(false);
      }
    },
    [onOptimistic],
  );

  const requestExamChange = useCallback(
    (current: ExamType | null, next: ExamType) => {
      // Allow first pick when preference is still null (boot / empty profile).
      if (next === current || switching) return;
      void applyExam(next);
    },
    [applyExam, switching],
  );

  return { switching, requestExamChange, applyExam };
}

/** Refresh entitlement snapshot (settings / home). */
export async function loadEntitlementSnapshot() {
  return hydrateEntitlement().catch(() => null);
}
