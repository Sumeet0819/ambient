import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadii } from '../../constants/theme';
import Svg, { Defs, Pattern, Path, Rect, Circle } from 'react-native-svg';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';

interface ProgressBarProps {
  progress: number; // 0 to 1
  fillColor?: string;
  trackColor?: string;
  height?: number;
  usePatternTrack?: boolean;
  style?: ViewStyle;
}

const GAS_BUBBLES = [
  { id: 1, size: 6, left: '8%', duration: 2000, delay: 0 },
  { id: 2, size: 4, left: '22%', duration: 1500, delay: 400 },
  { id: 3, size: 8, left: '42%', duration: 2500, delay: 800 },
  { id: 4, size: 5, left: '60%', duration: 1800, delay: 200 },
  { id: 5, size: 7, left: '78%', duration: 2200, delay: 600 },
  { id: 6, size: 3, left: '92%', duration: 1600, delay: 1000 },
  { id: 7, size: 5.5, left: '32%', duration: 2100, delay: 1200 },
  { id: 8, size: 4.5, left: '68%', duration: 1900, delay: 1500 },
];

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
        <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
          <MotiView
            from={{ translateX: 0 }}
            animate={{ translateX: -16 }} // Move by exactly twice the pattern width for a smooth loop
            transition={{
              loop: true,
              type: 'timing',
              duration: 800, // Constant steady scroll speed
              easing: Easing.linear,
            }}
            style={{ width: '150%', height: '100%' }}
          >
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
          </MotiView>
        </View>
      )}
      <MotiView
        from={{ width: '0%' }}
        animate={{ width: `${boundedProgress * 100}%` }}
        transition={{ type: 'timing', duration: 1200, easing: Easing.out(Easing.exp) }}
        style={[
          styles.fill,
          {
            backgroundColor: fillColor,
            borderRadius: height / 2,
            overflow: 'hidden',
          },
        ]}
      >
        {GAS_BUBBLES.map((bubble) => (
          <MotiView
            key={bubble.id}
            from={{ translateY: 10, opacity: 0, scale: 0.5 }}
            animate={{ translateY: -(height + 20), opacity: [0, 1, 0], scale: 1 }}
            transition={{
              loop: true,
              type: 'timing',
              duration: bubble.duration,
              delay: bubble.delay,
              easing: Easing.inOut(Easing.ease),
            }}
            style={{
              position: 'absolute',
              left: bubble.left,
              width: bubble.size,
              height: bubble.size,
              borderRadius: bubble.size / 2,
              backgroundColor: colors.accent,
              bottom: -10, // Start just below the visible area
            }}
          />
        ))}
      </MotiView>
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
