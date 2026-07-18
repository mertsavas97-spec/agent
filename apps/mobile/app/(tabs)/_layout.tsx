import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';

import Colors from '@/constants/Colors';
import { BannerSlot } from '@/src/features/ads';
import { colors } from '@/src/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <View style={styles.root} testID="tabs-with-ads">
      <View style={styles.tabs}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: Colors[colorScheme].tabIconSelected,
            tabBarInactiveTintColor: Colors[colorScheme].tabIconDefault,
            tabBarStyle: { backgroundColor: colors.white },
            headerStyle: { backgroundColor: colors.navy },
            headerTintColor: colors.white,
            headerShown: useClientOnlyValue(false, true),
          }}>
          <Tabs.Screen
            name="index"
            options={{
              title: 'Ana Sayfa',
              tabBarIcon: ({ color }) => (
                <SymbolView
                  name={{ ios: 'house.fill', android: 'home', web: 'home' }}
                  tintColor={color}
                  size={26}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="history"
            options={{
              title: 'Geçmiş',
              tabBarIcon: ({ color }) => (
                <SymbolView
                  name={{ ios: 'clock.fill', android: 'history', web: 'history' }}
                  tintColor={color}
                  size={26}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="stats"
            options={{
              title: 'İstatistik',
              tabBarIcon: ({ color }) => (
                <SymbolView
                  name={{
                    ios: 'chart.bar.fill',
                    android: 'bar_chart',
                    web: 'bar_chart',
                  }}
                  tintColor={color}
                  size={26}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profil',
              tabBarIcon: ({ color }) => (
                <SymbolView
                  name={{ ios: 'person.fill', android: 'person', web: 'person' }}
                  tintColor={color}
                  size={26}
                />
              ),
            }}
          />
        </Tabs>
      </View>
      <BannerSlot />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabs: { flex: 1 },
});
