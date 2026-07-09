import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '@theme';
import { Icon } from './Icon';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  style,
  testID,
}) => {
  const theme = useTheme();

  const background =
    variant === 'primary'
      ? theme.colors.primary
      : variant === 'danger'
      ? theme.colors.error
      : variant === 'secondary'
      ? theme.colors.surfaceVariant
      : 'transparent';
  const foreground =
    variant === 'primary'
      ? theme.colors.onPrimary
      : variant === 'danger'
      ? theme.colors.onError
      : variant === 'secondary'
      ? theme.colors.onSurface
      : theme.colors.primary;

  return (
    <Pressable
      testID={testID}
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled || loading}
      android_ripple={{ color: theme.colors.ripple }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: background,
          borderRadius: theme.radius.lg,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <View style={styles.content}>
          {icon ? <Icon name={icon} size={20} color={foreground} /> : null}
          <Text style={[theme.typography.labelLarge, { color: foreground }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
