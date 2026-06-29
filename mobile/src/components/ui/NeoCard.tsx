import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { borderRadii, useThemeColors } from '../../constants/theme';

interface NeoCardProps {
  children: React.ReactNode;
  variant?: 'white' | 'black' | 'green' | 'lightGray';
  style?: ViewStyle;
}

export const NeoCard: React.FC<NeoCardProps> = ({
  children,
  variant = 'white',
  style,
}) => {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  let backgroundColor = colors.primary;
  switch (variant) {
    case 'black':
      backgroundColor = colors.secondary;
      break;
    case 'green':
      backgroundColor = colors.accent;
      break;
    case 'lightGray':
      backgroundColor = colors.cardLight;
      break;
  }

  return (
    <View style={[styles.card, { backgroundColor }, style]}>
      {children}
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  card: {
    borderRadius: borderRadii.xl,
    padding: 24,
    overflow: 'hidden',
  },
});
