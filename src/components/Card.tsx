import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '@theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  onLongPress,
  style,
  testID,
}) => {
  const theme = useTheme();
  const cardStyle = [
    styles.card,
    {
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.xl,
      borderColor: theme.colors.border,
    },
    style,
  ];

  if (!onPress && !onLongPress) {
    return (
      <View testID={testID} style={cardStyle}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      onLongPress={onLongPress}
      // No android_ripple — keeps rounded corners on press.
      style={({ pressed }) => [...cardStyle, { opacity: pressed ? 0.92 : 1 }]}
    >
      {children}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
