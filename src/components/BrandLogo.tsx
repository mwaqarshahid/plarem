import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';
import { useTheme } from '@theme';
import { APP_NAME } from '@constants';

const logoColor = require('../assets/brand/logo-icon.png');
const logoWhite = require('../assets/brand/logo-white.png');

type BrandLogoVariant = 'auto' | 'color' | 'white';

interface BrandLogoProps {
  size?: number;
  /** auto = color on light theme, white on dark (matches splash). */
  variant?: BrandLogoVariant;
  style?: StyleProp<ImageStyle>;
}

/**
 * In-app Plarem mark — same asset family as the splash / launcher icon.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 56,
  variant = 'auto',
  style,
}) => {
  const theme = useTheme();
  const useWhite =
    variant === 'white' || (variant === 'auto' && theme.dark);

  return (
    <Image
      source={useWhite ? logoWhite : logoColor}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
      accessibilityLabel={`${APP_NAME} logo`}
    />
  );
};
