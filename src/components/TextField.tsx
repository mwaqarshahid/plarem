import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '@theme';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  errorTestID?: string;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  error,
  errorTestID,
  style,
  testID,
  ...rest
}) => {
  const theme = useTheme();
  const dynamicInputStyle = {
    backgroundColor: theme.colors.surfaceVariant,
    color: theme.colors.onSurface,
    borderRadius: theme.radius.lg,
    borderColor: error ? theme.colors.error : 'transparent',
  };
  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text
          style={[
            theme.typography.labelLarge,
            styles.label,
            { color: theme.colors.onSurfaceVariant },
          ]}>
          {label}
        </Text>
      ) : null}
      <TextInput
        {...rest}
        testID={testID}
        importantForAutofill="no"
        placeholderTextColor={theme.colors.onSurfaceVariant}
        style={[theme.typography.bodyLarge, styles.input, dynamicInputStyle, style]}
      />
      {error ? (
        <Text
          testID={errorTestID}
          style={[theme.typography.bodySmall, { color: theme.colors.error }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    marginLeft: 4,
  },
  input: {
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
  },
});
