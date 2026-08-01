import { useCallback, useRef } from 'react';
import { Alert } from 'react-native';

import { runRewardedExamSwitch } from '@/src/features/ads/runRewardedExamSwitch';
import { isPremiumAudience } from '@/src/features/ads/premiumGate';
import {
  hydrateEntitlement,
  type EntitlementSnapshot,
} from '@/src/features/paywall/entitlement';
import type { ExamType } from '@/src/lib/api/types';

import { examSwitchUserCopy } from './examSwitchCopy';
import { setExamPreferenceCache } from './examPreferenceCache';
import { callUpdateExamType } from './updateExamClient';

export type UseExamModeChangeOptions = {
  ent?: EntitlementSnapshot | null;
  /** Optimistic UI — called before network. */
  onOptimistic?: (next: ExamType) => void;
};

/**
 * Shared exam switch — confirm → rewarded ad (free) → optimistic sync.
 * Never disables the segmented control.
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

  const runSwitchAfterConfirm = useCallback(
    async (current: ExamType | null, next: ExamType) => {
      if (current != null) {
        const gate = await runRewardedExamSwitch();
        if (!gate.allowed) {
          Alert.alert(
            'Mod değişmedi',
            gate.reason === 'unavailable'
              ? 'Ödüllü reklam yüklenemedi (ağ / AdMob doluluk). Biraz sonra tekrar dene.'
              : 'Ödüllü reklamı sonuna kadar izleyince sınav modu değişir. Reklam açılmadıysa tekrar dene.',
          );
          return;
        }
      }
      if (inFlightRef.current === next) return;
      await applyExam(next);
    },
    [applyExam],
  );

  const requestExamChange = useCallback(
    (current: ExamType | null, next: ExamType) => {
      if (next === current) return;
      if (inFlightRef.current === next) return;

      // First pick (null → exam) is free and needs no confirm/ad.
      if (current == null) {
        void applyExam(next);
        return;
      }

      const copy = examSwitchUserCopy(next);
      const premium = isPremiumAudience();
      Alert.alert(copy.title, premium ? copy.premiumBody : copy.freeBody, [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: premium ? copy.confirmPremium : copy.confirmFree,
          onPress: () => {
            void runSwitchAfterConfirm(current, next);
          },
        },
      ]);
    },
    [applyExam, runSwitchAfterConfirm],
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
