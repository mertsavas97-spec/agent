import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { PaywallScreen } from '@/src/features/paywall/PaywallScreen';
import {
  activateLocalPremium,
  hydrateEntitlement,
} from '@/src/features/paywall/entitlement';
import type { PlanId } from '@/src/features/paywall/pricing';
import { colors } from '@/src/theme';

export default function PremiumRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string }>();
  const variant = params.source === 'quota' ? 'quota' : 'browse';

  async function onStart(planId: PlanId) {
    const res = await activateLocalPremium(planId);
    await hydrateEntitlement();
    if (res.ok) {
      Alert.alert(
        'Premium aktif',
        'Planın kaydedildi. Reklamsız ve sınırsız çözüme geçtin.',
        [{ text: 'Tamam', onPress: () => router.back() }],
      );
      return;
    }
    Alert.alert(
      'Satın alma hazır değil',
      'Play Billing bağlanınca burada tamamlanır. Şimdilik geliştirici sandbox kullan.',
    );
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
            const snap = await hydrateEntitlement();
            Alert.alert(
              snap.status === 'active' ? 'Premium bulundu' : 'Kayıt yok',
              snap.status === 'active'
                ? 'Aktif aboneliğin bu cihazda görünüyor.'
                : 'Geri yüklenecek satın alma bulunamadı.',
            );
          })();
        }}
        onOpenLegal={(doc) =>
          router.push({ pathname: '/settings/legal/[id]', params: { id: doc } })
        }
      />
    </>
  );
}
