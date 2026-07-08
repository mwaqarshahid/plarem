import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@theme';
import { AlertButton, AlertRequest, hideAlert, registerAlertListener } from '@utils/alert';
import { Button } from './Button';
import { Icon } from './Icon';

export const AppAlertProvider: React.FC = () => {
  const theme = useTheme();
  const [request, setRequest] = useState<AlertRequest | null>(null);

  useEffect(() => registerAlertListener(setRequest), []);

  const close = (): void => {
    hideAlert();
    setRequest(null);
  };

  const handlePress = (button: AlertButton): void => {
    close();
    button.onPress?.();
  };

  if (!request) {
    return null;
  }

  const buttons =
    request.buttons.length > 0 ? request.buttons : [{ text: 'OK', style: 'default' as const }];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <Pressable
        style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}
        onPress={close}>
        <Pressable
          style={[
            styles.dialog,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.xl,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={event => event.stopPropagation()}>
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: theme.colors.primaryContainer,
                borderRadius: theme.radius.pill,
              },
            ]}>
            <Icon name="information-outline" size={28} color={theme.colors.primary} />
          </View>
          <Text style={[theme.typography.titleLarge, styles.title, { color: theme.colors.onSurface }]}>
            {request.title}
          </Text>
          {request.message ? (
            <Text
              style={[
                theme.typography.bodyMedium,
                styles.message,
                { color: theme.colors.onSurfaceVariant },
              ]}>
              {request.message}
            </Text>
          ) : null}
          <View style={styles.actions}>
            {buttons.map((button, index) => (
              <Button
                key={`${button.text}-${index}`}
                label={button.text}
                variant={
                  button.style === 'destructive'
                    ? 'danger'
                    : button.style === 'cancel'
                      ? 'secondary'
                      : 'primary'
                }
                onPress={() => handlePress(button)}
                style={buttons.length === 1 ? styles.fullButton : styles.actionButton}
              />
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    padding: 24,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  iconWrap: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: 120,
  },
  fullButton: {
    width: '100%',
  },
});
