import React from 'react';
import { Switch, SwitchProps } from 'react-native';
import { useTheme } from '@theme';

export const AppSwitch: React.FC<SwitchProps> = props => {
  const theme = useTheme();
  const offTrack = theme.dark ? '#5A6075' : theme.colors.outline;
  const onTrack = theme.dark ? '#6B73E8' : theme.colors.primary;
  const thumbColor = props.value
    ? '#FFFFFF'
    : theme.dark
      ? '#E9EAF2'
      : '#FFFFFF';

  return (
    <Switch
      {...props}
      trackColor={{ false: offTrack, true: onTrack }}
      thumbColor={thumbColor}
      ios_backgroundColor={offTrack}
    />
  );
};
