import { Stack } from 'expo-router';
import { useThemeColors } from '../../src/constants/theme';

export default function AuthLayout() {
  const colors = useThemeColors();
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.secondary } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
