import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert } from 'react-native';

import {
  billingFailureMessage,
  purchasePremiumPlan,
  restorePremiumPurchases,
} from '@/src/features/paywall/billing';
import { PaywallScreen } from '@/src/features/paywall/PaywallScreen';
import { hydrateEntitlement } from '@/src/features/paywall/entitlement';
import type { PlanId } from '@/src/features/paywall/pricing';
import { colors } from '@/src/theme';

export default function PremiumRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string }>();
  const variant = params.source === 'quota' ? 'quota' : 'browse';

  async function onStart(planId: PlanId) {
    const res = await purchasePremiumPlan(planId);
    await hydrateEntitlement();
    if (res.ok) {
      const via =
        res.reason === 'play'
          ? 'Play Billing'
          : res.reason === 'sandbox'
            ? 'sandbox'
            : 'geliştirici';
      Alert.alert(
        'Premium aktif',
        `Planın kaydedildi (${via}). Reklamsız ve sınırsız çözüme geçtin.`,
        [{ text: 'Tamam', onPress: () => router.back() }],
      );
      return;
    }
    if (res.reason === 'user_cancelled') return;
    Alert.alert('Satın alma tamamlanamadı', billingFailureMessage(res.reason));
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Premium',
          headerStyle: { backgroundColor: colors.navy },
          headerTintColor: '#fff',
          headerTitleStyle: { fontFamily: 'Poppins-SemiBold' },
        }}
      />
      <PaywallScreen
        variant={variant}
        onStart={(id) => void onStart(id)}
        onDismiss={() => router.back()}
        onRestore={() => {
          void (async () => {
            const restored = await restorePremiumPurchases();
            const snap = await hydrateEntitlement();
            if (restored.ok || snap.status === 'active') {
              Alert.alert('Premium bulundu', 'Aktif aboneliğin bu cihazda görünüyor.');
              return;
            }
            Alert.alert('Geri yükleme', billingFailureMessage(restored.reason ?? 'none'));
          })();
        }}
        onOpenLegal={(doc) =>
          router.push({ pathname: '/settings/legal/[id]', params: { id: doc } })
        }
      />
    </>
  );
}
