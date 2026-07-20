import { useFonts } from 'expo-font';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { BootstrapGate } from '@/src/features/auth/BootstrapGate';
import { colors } from '@/src/theme';

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

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <ThemeProvider value={cozbilTheme}>
      <BootstrapGate>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="onboarding"
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen
            name="capture-confirm"
            options={{
              title: 'Fotoğrafı kontrol et',
              headerBackTitle: 'Geri',
              headerStyle: { backgroundColor: colors.navy },
              headerTintColor: '#fff',
              headerTitleStyle: { fontFamily: 'Poppins-SemiBold' },
            }}
          />
          <Stack.Screen
            name="solve"
            options={{
              title: 'Çözüm',
              headerBackTitle: 'Geri',
              headerStyle: { backgroundColor: colors.navy },
              headerTintColor: '#fff',
              headerTitleStyle: { fontFamily: 'Poppins-SemiBold' },
            }}
          />
          <Stack.Screen
            name="solve-batch"
            options={{
              title: 'Çoklu çözüm',
              headerBackTitle: 'Geri',
              headerStyle: { backgroundColor: colors.navy },
              headerTintColor: '#fff',
              headerTitleStyle: { fontFamily: 'Poppins-SemiBold' },
            }}
          />
          <Stack.Screen
            name="sample/[id]"
            options={{
              title: 'Örnek anlatım',
              headerBackTitle: 'Geri',
              headerStyle: { backgroundColor: colors.navy },
              headerTintColor: '#fff',
              headerTitleStyle: { fontFamily: 'Poppins-SemiBold' },
            }}
          />
          <Stack.Screen
            name="topic/[id]"
            options={{
              title: 'Konu anlatımı',
              headerBackTitle: 'Geri',
              headerStyle: { backgroundColor: colors.navy },
              headerTintColor: '#fff',
              headerTitleStyle: { fontFamily: 'Poppins-SemiBold' },
            }}
          />
          <Stack.Screen
            name="history/[attemptId]"
            options={{
              title: 'Geçmiş çözüm',
              headerBackTitle: 'Geri',
              headerStyle: { backgroundColor: colors.navy },
              headerTintColor: '#fff',
              headerTitleStyle: { fontFamily: 'Poppins-SemiBold' },
            }}
          />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </BootstrapGate>
    </ThemeProvider>
  );
}
