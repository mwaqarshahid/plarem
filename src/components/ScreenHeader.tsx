import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  titleTestID?: string;
  subtitleTestID?: string;
}

/**
 * Fixed top-of-screen heading shared by the tab screens so they all get
 * identical safe-area handling, margins, and height.
 */
export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  titleTestID,
  subtitleTestID,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <Text
        testID={titleTestID}
        style={[
          theme.typography.headlineMedium,
          { color: theme.colors.onSurface },
        ]}
      >
        {title}
      </Text>
      <Text
        testID={subtitleTestID}
        numberOfLines={1}
        style={[
          theme.typography.bodySmall,
          { color: theme.colors.onSurfaceVariant },
        ]}
      >
        {subtitle ?? ' '}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
});
