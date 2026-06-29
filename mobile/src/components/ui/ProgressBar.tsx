import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadii } from '../../constants/theme';
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg';

interface ProgressBarProps {
  progress: number; // 0 to 1
  fillColor?: string;
  trackColor?: string;
  height?: number;
  usePatternTrack?: boolean;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  fillColor = colors.secondary,
  trackColor = colors.cardLight,
  height = 12,
  usePatternTrack = false,
  style,
}) => {
  const boundedProgress = Math.min(Math.max(progress, 0), 1);

  return (
    <View style={[styles.container, { height, backgroundColor: usePatternTrack ? 'transparent' : trackColor }, style]}>
      {usePatternTrack && (
        <View style={StyleSheet.absoluteFill}>
          <Svg width="100%" height="100%">
            <Defs>
              <Pattern id="diagonalHatch" patternUnits="userSpaceOnUse" width="8" height="8">
                <Path
                  d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4"
                  stroke={colors.textMuted}
                  strokeWidth="1.5"
                  strokeLinecap="square"
                  opacity={0.3}
                />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#diagonalHatch)" rx={height / 2} />
          </Svg>
        </View>
      )}
      <View
        style={[
          styles.fill,
          {
            width: `${boundedProgress * 100}%`,
            backgroundColor: fillColor,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: borderRadii.pill,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
