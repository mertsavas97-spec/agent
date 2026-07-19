import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';

import { topicsForExam } from '@/src/data';
import { callUpdateExamType } from '@/src/features/exam/updateExamClient';
import { callRequestAccountDeletion } from '@/src/features/profile/deleteRequestClient';
import { ProfilePanel } from '@/src/features/profile/ProfilePanel';
import {
  consentLabel,
  formatRemainingQuota,
  remainingFreeSolves,
} from '@/src/features/profile/quotaDisplay';
import { ensureSignedIn, signOutUser } from '@/src/lib/auth';
import { getFirebase } from '@/src/lib/firebase';
import type { ExamType } from '@/src/lib/api/types';

export default function ProfileScreen() {
  const router = useRouter();
  const [examType, setExamType] = useState<ExamType | null>(null);
  const [switching, setSwitching] = useState(false);
  const [quotaLabel, setQuotaLabel] = useState('—');
  const [consentText, setConsentText] = useState('—');
  const [deleteRequested, setDeleteRequested] = useState(false);

  const reload = useCallback(async () => {
    const user = await ensureSignedIn();
    const { db } = getFirebase();
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (!snap.exists()) return;
    const data = snap.data();
    const et = data.examType;
    if (et === 'lgs' || et === 'ygs' || et === 'kpss' || et === 'trafik') setExamType(et);
    setQuotaLabel(
      formatRemainingQuota(
        remainingFreeSolves({
          dailySolveCount: Number(data.dailySolveCount ?? 0),
          dailySolveDate: (data.dailySolveDate as string | null) ?? null,
          subscriptionStatus: String(data.subscriptionStatus ?? 'free'),
        }),
      ),
    );
    setConsentText(
      consentLabel({
        consentAcceptedAt: data.consentAcceptedAt,
        parentalConsentAt: data.parentalConsentAt,
        ageBand: data.ageBand as string | undefined,
      }),
    );
    setDeleteRequested(Boolean(data.deleteRequestedAt));
  }, []);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void (async () => {
        try {
          await reload();
        } catch {
          if (!alive) return;
        }
      })();
      return () => {
        alive = false;
      };
    }, [reload]),
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

  function onSignOut() {
    Alert.alert('Çıkış', 'Hesabından çıkmak istiyor musun?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Çıkış yap',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await signOutUser();
              router.replace('/onboarding');
            } catch {
              Alert.alert('Çıkış yapılamadı', 'Tekrar dener misin?');
            }
          })();
        },
      },
    ]);
  }

  function onRequestDelete() {
    Alert.alert(
      'Veri silme talebi',
      'Hesap ve çözüm verilerin için silme talebi oluşturulacak. Bu işlem geri alınamaz.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Talep et',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await callRequestAccountDeletion();
                setDeleteRequested(true);
                Alert.alert('Talep alındı', 'Veri silme talebin kaydedildi.');
              } catch {
                Alert.alert('Talep gönderilemedi', 'Bağlantını kontrol edip tekrar dene.');
              }
            })();
          },
        },
      ],
    );
  }

  const catalogCount = examType ? topicsForExam(examType).length : 0;

  return (
    <ProfilePanel
      examType={examType}
      onExamChange={(e) => void onExamChange(e)}
      examSwitchDisabled={switching}
      quotaLabel={quotaLabel}
      consentLabel={consentText}
      catalogCount={catalogCount}
      deleteRequested={deleteRequested}
      onSignOut={onSignOut}
      onRequestDelete={onRequestDelete}
    />
  );
}
