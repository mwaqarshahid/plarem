import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@theme';
import { Icon } from './Icon';

interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message }) => {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: theme.colors.primaryContainer, borderRadius: theme.radius.pill },
        ]}>
        <Icon name={icon} size={40} color={theme.colors.primary} />
      </View>
      <Text style={[theme.typography.titleLarge, { color: theme.colors.onSurface }]}>{title}</Text>
      <Text
        style={[
          theme.typography.bodyMedium,
          styles.message,
          { color: theme.colors.onSurfaceVariant },
        ]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
    gap: 12,
  },
  iconCircle: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  message: {
    textAlign: 'center',
  },
});
