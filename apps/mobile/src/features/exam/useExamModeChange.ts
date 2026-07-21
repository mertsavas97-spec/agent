import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { runRewardedExamSwitch } from '@/src/features/ads';
import {
  hydrateEntitlement,
  isPremiumActive,
  type EntitlementSnapshot,
} from '@/src/features/paywall/entitlement';
import type { ExamType } from '@/src/lib/api/types';

import { EXAM_LABEL } from './examLabels';
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
 * Free users: rewarded gate (settings parity).
 */
export function useExamModeChange(options: UseExamModeChangeOptions = {}) {
  const [switching, setSwitching] = useState(false);
  const onOptimistic = options.onOptimistic;
  const ent = options.ent;

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
      if (!current || next === current || switching) return;

      const premium = isPremiumActive(ent ?? undefined);

      if (premium) {
        void applyExam(next);
        return;
      }

      const label = EXAM_LABEL[next];
      Alert.alert(
        'Mod değiştir',
        `${label} paketine geçmek için bir reklam izlemen gerekir.\n\nNot: Reklam SDK henüz bağlı değil; bu sürümde stub/demo akışı çalışır.`,
        [
          { text: 'Vazgeç', style: 'cancel' },
          {
            text: 'Reklam izle ve geç',
            onPress: () => {
              void (async () => {
                setSwitching(true);
                try {
                  const unlock = await runRewardedExamSwitch();
                  if (!unlock.allowed) {
                    Alert.alert(
                      'Devam edilmedi',
                      'Reklam tamamlanmadan sınav paketi değiştirilemez.',
                    );
                    return;
                  }
                  await applyExam(next);
                } finally {
                  setSwitching(false);
                }
              })();
            },
          },
        ],
      );
    },
    [applyExam, ent, switching],
  );

  return { switching, requestExamChange, applyExam };
}

/** Refresh entitlement snapshot (settings / home). */
export async function loadEntitlementSnapshot() {
  return hydrateEntitlement().catch(() => null);
}
