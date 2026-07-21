import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@theme';
import { BrandLogo } from './BrandLogo';
import { Icon } from './Icon';

interface EmptyStateProps {
  title: string;
  message: string;
  /** Material icon name — ignored when `brand` is true. */
  icon?: string;
  /** Show the Plarem brand mark instead of a generic icon. */
  brand?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  brand = false,
  title,
  message,
}) => {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      {brand ? (
        <BrandLogo size={88} />
      ) : (
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: theme.colors.primaryContainer,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <Icon
            name={icon ?? 'information-outline'}
            size={40}
            color={theme.colors.primary}
          />
        </View>
      )}
      <Text style={[theme.typography.titleLarge, { color: theme.colors.onSurface }]}>
        {title}
      </Text>
      <Text
        style={[
          theme.typography.bodyMedium,
          styles.message,
          { color: theme.colors.onSurfaceVariant },
        ]}
      >
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
