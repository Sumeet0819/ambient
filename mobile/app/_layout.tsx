import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store, RootState, AppDispatch } from '../src/store';
import { hydrateAuth } from '../src/store/auth.slice';

function RootLayoutInner() {
  const token = useSelector((state: RootState) => state.auth.token);
  const dispatch = useDispatch<AppDispatch>();
  const [isReady, setIsReady] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    dispatch(hydrateAuth()).then(() => setIsReady(true));
  }, [dispatch]);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!token && !inAuthGroup) {
      router.replace('/(auth)');
    } else if (token && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [token, isReady, segments, router]);

  if (!isReady) return null;

  return <Slot />;
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <RootLayoutInner />
    </Provider>
  );
}
