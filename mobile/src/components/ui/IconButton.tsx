import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { colors, borderRadii } from '../../constants/theme';

interface IconButtonProps {
  icon: LucideIcon;
  variant?: 'black' | 'green' | 'white' | 'gray';
  size?: number;
  iconSize?: number;
  onPress: () => void;
  style?: ViewStyle;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  variant = 'black',
  size = 48,
  iconSize = 24,
  onPress,
  style,
}) => {
  let backgroundColor = colors.secondary;
  let iconColor = colors.primary;

  switch (variant) {
    case 'green':
      backgroundColor = colors.accent;
      iconColor = colors.secondary;
      break;
    case 'white':
      backgroundColor = colors.primary;
      iconColor = colors.secondary;
      break;
    case 'gray':
      backgroundColor = colors.cardLight;
      iconColor = colors.secondary;
      break;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.button,
        {
          width: size,
          height: size,
          backgroundColor,
          borderRadius: size / 2, // Circular by default
        },
        style,
      ]}
    >
      <Icon size={iconSize} color={iconColor} strokeWidth={2.5} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
