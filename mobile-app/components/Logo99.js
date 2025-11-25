import React from 'react';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

export default function Logo99({ size = 24, color = '#00D9FF', backgroundColor }) {
  const bgColor = backgroundColor || color;
  const textColor = backgroundColor ? color : '#FFFFFF';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {!backgroundColor && (
        <Circle cx="12" cy="12" r="10" fill={bgColor} />
      )}
      {/* Número 99 no centro */}
      <SvgText
        x="12"
        y="16"
        fontSize="10"
        fontWeight="bold"
        fill={textColor}
        textAnchor="middle"
      >
        99
      </SvgText>
    </Svg>
  );
}
