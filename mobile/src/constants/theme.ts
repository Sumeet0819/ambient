import { useSelector } from 'react-redux';
import { RootState } from '../store';

export const darkColors = {
  mode: 'dark',
  primary: '#FFFFFF', // Main dashboard background
  secondary: '#000000', // History/Analytics background
  accentSecondary: '#FF6B6B', // Coral Red for specific categories
  cardLight: '#F5F5F5',
  cardDark: '#1C1C1E', // Used in home container, modal content, fabMenu
  
  background: '#050505',
  backgroundGradient: ['#00B67A', '#004D36', '#0A0A0A', '#000000'],
  surfaceGradient: ['#00B67A', '#004D36', '#161616'],
  surface: '#141414',
  
  textLight: '#000000',
  textDark: '#FFFFFF',
  text: '#FFFFFF',
  textMuted: '#8E8E93',
  textInverse: '#000000',
  
  icon: '#FFFFFF',
  iconMuted: 'rgba(255,255,255,0.55)',
  
  border: 'rgba(255,255,255,0.05)',
  borderLight: 'rgba(255,255,255,0.1)',
  
  overlay: 'rgba(255,255,255,0.1)',
  
  chartPink: '#FFC1E3',
  chartGreen: '#FFFFFF',
  chartRed: '#FFC1E3', // Using pink for red in dark mode
  chartYellow: '#FFFAC1',
  chartPurple: '#E1D5FF',
};

export const lightColors = {
  mode: 'light',
  primary: '#000000',
  secondary: '#F2F2F7',
  accentSecondary: '#FF3B30',
  cardLight: '#1C1C1E',
  cardDark: '#F2F2F7',
  
  background: '#F2F2F7',
  backgroundGradient: ['#00B67A', '#52B788', '#F2F2F7', '#F2F2F7'],
  surfaceGradient: ['#00B67A', '#52B788', '#FFFFFF'],
  surface: '#FFFFFF',
  
  textLight: '#FFFFFF',
  textDark: '#000000',
  text: '#000000',
  textMuted: '#6E6E73',
  textInverse: '#FFFFFF',
  
  icon: '#000000',
  iconMuted: 'rgba(0,0,0,0.5)',
  
  border: 'rgba(0,0,0,0.05)',
  borderLight: 'rgba(0,0,0,0.1)',
  
  overlay: 'rgba(0,0,0,0.05)',
  
  chartPink: '#FF2D55',
  chartGreen: '#000000',
  chartRed: '#FF3B30',
  chartYellow: '#FFCC00',
  chartPurple: '#AF52DE',
};

// Fallback for files that still import colors directly (if any)
export const colors = darkColors;

import { useColorScheme } from 'react-native';

export const useThemeColors = () => {
  const themeMode = useSelector((state: RootState) => state.settings.themeMode);
  const systemScheme = useColorScheme();
  const isLightMode = themeMode === 'system' ? systemScheme === 'light' : themeMode === 'light';
  return isLightMode ? lightColors : darkColors;
};

export const typography = {
  displayDigital: { fontFamily: 'Quantico_400Regular', fontSize: 56 },
  displayDigitalBold: { fontFamily: 'Quantico_700Bold', fontSize: 56 },
  heading1: { fontSize: 48, fontWeight: '300' as const },
  heading2: { fontSize: 32, fontWeight: '400' as const },
  heading3: { fontSize: 24, fontWeight: '500' as const },
  bodyLarge: { fontSize: 18, fontWeight: '400' as const },
  bodyMedium: { fontSize: 16, fontWeight: '400' as const },
  bodySmall: { fontSize: 14, fontWeight: '500' as const },
  label: { fontSize: 12, fontWeight: '600' as const },
};

export const borderRadii = {
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 9999, // fully rounded
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
