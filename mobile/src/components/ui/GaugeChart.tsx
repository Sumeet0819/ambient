import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, Pattern, Rect } from 'react-native-svg';
import { useThemeColors } from '../../constants/theme';

interface GaugeChartProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
  progress,
  size = 200,
  strokeWidth = 30,
}) => {
  const colors = useThemeColors();
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  // Use a semi-circle from 180 to 0 degrees
  // Actually, the UI shows a donut that is mostly semi-circle
  // Let's create an arc from angle 160 to 20
  
  const startAngle = 180;
  const endAngle = 0;
  
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 180) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const createArc = (start: number, end: number) => {
    const startPt = polarToCartesian(center, center, radius, end);
    const endPt = polarToCartesian(center, center, radius, start);
    const largeArcFlag = end - start <= 180 ? '0' : '1';

    return [
      'M', startPt.x, startPt.y,
      'A', radius, radius, 0, largeArcFlag, 0, endPt.x, endPt.y
    ].join(' ');
  };

  const totalAngle = Math.abs(startAngle - endAngle);
  const progressAngle = startAngle - (totalAngle * progress);

  return (
    <View style={{ width: size, height: size / 2 + strokeWidth, alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <Pattern id="stripe" patternUnits="userSpaceOnUse" width="10" height="10">
            <Path d="M-2,2 l4,-4 M0,10 l10,-10 M8,12 l4,-4" stroke={colors.textMuted} strokeWidth="2" opacity={0.3} />
          </Pattern>
        </Defs>
        {/* Track Pattern */}
        <Path
          d={createArc(startAngle, endAngle)}
          fill="none"
          stroke="url(#stripe)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Progress Fill */}
        {progress > 0 && (
          <Path
            d={createArc(startAngle, progressAngle)}
            fill="none"
            stroke={colors.accent}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}
      </Svg>
    </View>
  );
};
