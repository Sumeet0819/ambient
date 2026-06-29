import { useSelector } from 'react-redux';
import { RootState } from '../store';

export const darkColors = {
  primary: '#FFFFFF', // Main dashboard background
  secondary: '#000000', // History/Analytics background
  accent: '#20D770', // Primary Neon Green
  accentSecondary: '#FF6B6B', // Coral Red for specific categories
  cardLight: '#F5F5F5',
  cardDark: '#1C1C1E',
  textLight: '#000000', // Text on light backgrounds
  textDark: '#FFFFFF', // Text on dark backgrounds
  textMuted: '#8E8E93',
};

export const lightColors = {
  primary: '#000000', // Was white
  secondary: '#FFFFFF', // Was black
  accent: '#20D770', 
  accentSecondary: '#FF6B6B',
  cardLight: '#1C1C1E', // inverted
  cardDark: '#F5F5F5', // inverted
  textLight: '#FFFFFF', 
  textDark: '#000000', 
  textMuted: '#6E6E73',
};

// Fallback for files that still import colors directly (if any)
export const colors = darkColors;

export const useThemeColors = () => {
  const isLightMode = useSelector((state: RootState) => state.settings.isLightMode);
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
