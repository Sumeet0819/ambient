import { Stack, useRouter, useSegments, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store, RootState, AppDispatch } from '../src/store';
import { hydrateAuth } from '../src/store/auth.slice';
import { hydrateSettings } from '../src/store/settings.slice';
import { useFonts, Quantico_400Regular, Quantico_700Bold } from '@expo-google-fonts/quantico';
import { StatusBar } from 'expo-status-bar';

function RootLayoutInner() {
  const token = useSelector((state: RootState) => state.auth.token);
  const isLightMode = useSelector((state: RootState) => state.settings.isLightMode);
  const dispatch = useDispatch<AppDispatch>();
  const [isReady, setIsReady] = useState(false);
  const segments = useSegments();
  const router = useRouter();
  const pathname = usePathname();

  const [fontsLoaded] = useFonts({
    Quantico_400Regular,
    Quantico_700Bold,
  });

  useEffect(() => {
    Promise.all([
      dispatch(hydrateAuth()),
      dispatch(hydrateSettings())
    ]).then(() => setIsReady(true));
  }, [dispatch]);

  useEffect(() => {
    if (!isReady || !fontsLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!token && !inAuthGroup) {
      router.replace('/(auth)');
    } else if (token && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [token, isReady, segments, router]);

  if (!isReady || !fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 48, fontWeight: 'bold', color: '#20D770', letterSpacing: -1, marginBottom: 24 }}>
          AI Finance
        </Text>
        <ActivityIndicator color="#20D770" size="large" />
      </View>
    );
  }

  let statusBarStyle: 'light' | 'dark' | 'auto' | 'inverted' = isLightMode ? 'dark' : 'light';
  if (pathname === '/analytics') {
    statusBarStyle = isLightMode ? 'light' : 'dark';
  }

  return (
    <>
      <StatusBar style={statusBarStyle} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: isLightMode ? '#FFFFFF' : '#000000' } }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <RootLayoutInner />
    </Provider>
  );
}
