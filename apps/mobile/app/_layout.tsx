import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
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
    Poppins: Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
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
            name="solve"
            options={{
              title: 'Çözüm',
              headerStyle: { backgroundColor: colors.navy },
              headerTintColor: '#fff',
              headerTitleStyle: { fontFamily: 'Poppins-SemiBold' },
            }}
          />
          <Stack.Screen
            name="sample/[id]"
            options={{
              title: 'Örnek anlatım',
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
