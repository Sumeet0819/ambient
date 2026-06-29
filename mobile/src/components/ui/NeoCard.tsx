import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadii } from '../../constants/theme';

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

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadii.xl,
    padding: 24,
    overflow: 'hidden',
  },
});
