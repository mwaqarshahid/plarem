import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '@theme';
import { Icon } from './Icon';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: string;
  color?: string;
  testID?: string;
}

export const Chip: React.FC<ChipProps> = ({ label, selected, onPress, icon, color, testID }) => {
  const theme = useTheme();
  const accent = color ?? theme.colors.primary;
  const background = selected ? accent : theme.colors.surfaceVariant;
  const foreground = selected
    ? theme.dark
      ? theme.colors.onPrimary
      : '#FFFFFF'
    : theme.colors.onSurfaceVariant;

  return (
    <Pressable
      testID={testID}
      accessibilityLabel={label}
      onPress={onPress}
      android_ripple={{ color: theme.colors.ripple }}
      style={[
        styles.chip,
        { backgroundColor: background, borderRadius: theme.radius.pill },
      ]}>
      {icon ? <Icon name={icon} size={16} color={foreground} /> : null}
      <Text style={[theme.typography.labelLarge, { color: foreground }]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    overflow: 'hidden',
  },
});
