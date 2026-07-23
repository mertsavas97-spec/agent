import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';

import { topicsForExam } from '@/src/data';
import { readExamPreference } from '@/src/features/exam/examPreference';
import { isExamType } from '@/src/features/exam/examTypes';
import {
  hydrateEntitlement,
  isPremiumActive,
  type EntitlementSnapshot,
} from '@/src/features/paywall/entitlement';
import { planById } from '@/src/features/paywall/pricing';
import { callRequestAccountDeletion } from '@/src/features/profile/deleteRequestClient';
import { callPurgeAccount } from '@/src/features/profile/purgeAccountClient';
import { ProfilePanel } from '@/src/features/profile/ProfilePanel';
import {
  consentLabel,
  dailyLimitForProfile,
  formatRemainingQuota,
  remainingFreeSolves,
} from '@/src/features/profile/quotaDisplay';
import { ensureSignedIn, signOutUser } from '@/src/lib/auth';
import { getFirebase } from '@/src/lib/firebase';
import type { ExamType } from '@/src/lib/api/types';

export default function ProfileScreen() {
  const router = useRouter();
  const [examType, setExamType] = useState<ExamType | null>(null);
  const [quotaLabel, setQuotaLabel] = useState('—');
  const [consentText, setConsentText] = useState('—');
  const [deleteRequested, setDeleteRequested] = useState(false);
  const [ent, setEnt] = useState<EntitlementSnapshot | null>(null);

  const reload = useCallback(async () => {
    const user = await ensureSignedIn();
    const { db } = getFirebase();
    const snap = await getDoc(doc(db, 'users', user.uid));
    const entitlement = await hydrateEntitlement();
    setEnt(entitlement);
    if (!snap.exists()) return;
    const data = snap.data();
    const preferred = await readExamPreference();
    const et = data.examType;
    if (preferred) setExamType(preferred);
    else if (isExamType(et)) setExamType(et);
    const premium = isPremiumActive(entitlement);
    const quotaInput = {
      dailySolveCount: Number(data.dailySolveCount ?? 0),
      dailySolveDate: (data.dailySolveDate as string | null) ?? null,
      subscriptionStatus: String(data.subscriptionStatus ?? 'free'),
      rewardedBonusCount: Number(data.rewardedBonusCount ?? 0),
      rewardedBonusDate: (data.rewardedBonusDate as string | null) ?? null,
    };
    setQuotaLabel(
      premium
        ? 'Sınırsız (Premium)'
        : formatRemainingQuota(
            remainingFreeSolves(quotaInput),
            dailyLimitForProfile(quotaInput),
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
      'Hesap ve çözüm verilerin için silme talebi oluşturulacak. İstersen ardından kalıcı silme adımını da çalıştırabilirsin.',
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
                Alert.alert(
                  'Talep alındı',
                  'Veri silme talebin kaydedildi. Kalıcı silmek için “Hesabı kalıcı sil”e dokun.',
                );
              } catch {
                Alert.alert('Talep gönderilemedi', 'Bağlantını kontrol edip tekrar dene.');
              }
            })();
          },
        },
      ],
    );
  }

  function onPurgeAccount() {
    Alert.alert(
      'Hesabı kalıcı sil',
      'Hesabın, çözümlerin ve yüklenen görseller kalıcı olarak silinir. Bu işlem geri alınamaz.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Kalıcı sil',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                const result = await callPurgeAccount();
                if (!result.ok) {
                  Alert.alert(
                    'Silinemedi',
                    result.reason === 'delete_not_requested'
                      ? 'Önce veri silme talebi oluşturmalısın.'
                      : 'Bağlantını kontrol edip tekrar dene.',
                  );
                  return;
                }
                try {
                  await signOutUser();
                } catch {
                  /* auth user may already be gone */
                }
                router.replace('/onboarding');
              } catch {
                Alert.alert('Silinemedi', 'Bağlantını kontrol edip tekrar dene.');
              }
            })();
          },
        },
      ],
    );
  }

  const catalogCount = examType ? topicsForExam(examType).length : 0;
  const premium = isPremiumActive(ent ?? undefined);
  const planLabel =
    premium && ent?.planId
      ? `${planById(ent.planId).title} plan · ${planById(ent.planId).priceLabel}`
      : 'Premium aktif';

  return (
    <ProfilePanel
      examType={examType}
      quotaLabel={quotaLabel}
      consentLabel={consentText}
      catalogCount={catalogCount}
      deleteRequested={deleteRequested}
      isPremium={premium}
      planLabel={planLabel}
      onSignOut={onSignOut}
      onRequestDelete={onRequestDelete}
      onPurgeAccount={onPurgeAccount}
      onOpenPremium={() => router.push('/premium')}
      onOpenSettings={() => router.push('/settings')}
    />
  );
}
