import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export default function LogoIFood({ size = 24, color = '#EA1D2C', backgroundColor }) {
  const bgColor = backgroundColor || color;
  const iconColor = backgroundColor ? color : '#FFFFFF';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {!backgroundColor && (
        <Circle cx="12" cy="12" r="10" fill={bgColor} />
      )}
      {/* Letra "i" estilizada */}
      <Path
        d="M12 7.5c0.55 0 1-0.45 1-1s-0.45-1-1-1-1 0.45-1 1 0.45 1 1 1zm-1 3v5c0 0.55 0.45 1 1 1s1-0.45 1-1v-5c0-0.55-0.45-1-1-1s-1 0.45-1 1z"
        fill={iconColor}
      />
      {/* Linha decorativa embaixo representando prato/comida */}
      <Path
        d="M8 15h8v1H8v-1z"
        fill={iconColor}
      />
    </Svg>
  );
}
