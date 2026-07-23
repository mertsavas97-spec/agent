import { useCallback, useRef } from 'react';
import { Alert } from 'react-native';

import {
  hydrateEntitlement,
  type EntitlementSnapshot,
} from '@/src/features/paywall/entitlement';
import type { ExamType } from '@/src/lib/api/types';

import { setExamPreferenceCache } from './examPreferenceCache';
import { callUpdateExamType } from './updateExamClient';

export type UseExamModeChangeOptions = {
  ent?: EntitlementSnapshot | null;
  /** Optimistic UI — called before network. */
  onOptimistic?: (next: ExamType) => void;
};

/**
 * Shared exam switch — optimistic local preference, background sync.
 * Never disables the segmented control: awaiting network was making taps
 * feel “stuck”. In-flight duplicate for the *same* target is ignored; after
 * settle, the same package can be requested again (focus races / retries).
 */
export function useExamModeChange(options: UseExamModeChangeOptions = {}) {
  const onOptimistic = options.onOptimistic;
  const inFlightRef = useRef<ExamType | null>(null);

  const applyExam = useCallback(
    async (next: ExamType) => {
      inFlightRef.current = next;
      setExamPreferenceCache(next);
      onOptimistic?.(next);
      try {
        await callUpdateExamType(next);
      } catch {
        if (inFlightRef.current === next) {
          Alert.alert('Sınav değiştirilemedi', 'Bağlantını kontrol edip tekrar dene.');
        }
      } finally {
        if (inFlightRef.current === next) {
          inFlightRef.current = null;
        }
      }
    },
    [onOptimistic],
  );

  const requestExamChange = useCallback(
    (current: ExamType | null, next: ExamType) => {
      if (next === current) return;
      // Only skip while this exact package change is already syncing.
      if (inFlightRef.current === next) return;
      void applyExam(next);
    },
    [applyExam],
  );

  return {
    /** Kept for API compat — UI must not disable tabs on this. */
    switching: false,
    requestExamChange,
    applyExam,
  };
}

/** Refresh entitlement snapshot (settings / home). */
export async function loadEntitlementSnapshot() {
  return hydrateEntitlement().catch(() => null);
}
