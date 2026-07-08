import React from 'react';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

type MDIName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

interface IconProps {
  name: string;
  size?: number;
  color?: string;
}

/**
 * Thin wrapper so the rest of the app can pass icon names as plain strings
 * (e.g. from category metadata) without fighting the generated name union.
 */
export const Icon: React.FC<IconProps> = ({ name, size = 24, color }) => (
  <MaterialDesignIcons name={name as MDIName} size={size} color={color} />
);
