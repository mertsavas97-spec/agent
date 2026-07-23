import { useFonts } from 'expo-font';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { BootstrapGate } from '@/src/features/auth/BootstrapGate';
import { colors, screenHeaderOptions } from '@/src/theme';
import { BrandMarkCache } from '@/src/ui/BrandMarkCache';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const cozbilTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.navy,
    background: colors.surface,
    card: colors.white,
    text: colors.navy,
    border: colors.border,
    notification: colors.orange,
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Poppins: require('../assets/fonts/Poppins_400Regular.ttf'),
    'Poppins-Medium': require('../assets/fonts/Poppins_500Medium.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins_600SemiBold.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins_700Bold.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <ThemeProvider value={cozbilTheme}>
      <BrandMarkCache />
      <BootstrapGate>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="onboarding"
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen name="capture-confirm" options={screenHeaderOptions('Fotoğrafı kontrol et')} />
          <Stack.Screen
            name="capture-confirm-batch"
            options={screenHeaderOptions('Fotoğrafları kontrol et')}
          />
          <Stack.Screen name="premium" options={screenHeaderOptions('Premium')} />
          <Stack.Screen name="settings/index" options={screenHeaderOptions('Ayarlar')} />
          <Stack.Screen name="settings/legal/[id]" options={screenHeaderOptions('Hukuki')} />
          <Stack.Screen name="solve" options={screenHeaderOptions('Çözüm')} />
          <Stack.Screen name="solve-batch" options={screenHeaderOptions('Çoklu çözüm')} />
          <Stack.Screen name="sample/[id]" options={screenHeaderOptions('Örnek anlatım')} />
          <Stack.Screen name="topic/[id]" options={screenHeaderOptions('Konu anlatımı')} />
          <Stack.Screen name="history/[attemptId]" options={screenHeaderOptions('Geçmiş çözüm')} />
        </Stack>
      </BootstrapGate>
    </ThemeProvider>
  );
}
