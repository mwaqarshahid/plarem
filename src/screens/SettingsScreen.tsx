import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@theme';
import { useAppDispatch, useAppSelector } from '@hooks';
import { setNotificationSound, setThemePreference } from '@store';
import {
  checkBackgroundLocation,
  checkForegroundLocation,
  checkNotifications,
  openAppSettings,
  PermissionState,
  previewNotificationSound,
  requestBackgroundLocation,
  requestForegroundLocation,
  requestNotifications,
} from '@services';
import { NOTIFICATION_SOUNDS, APP_NAME, APP_PRIVACY_NOTE, APP_TAGLINE, APP_VERSION, PERMISSION_STATE_LABELS } from '@constants';
import { Card, Chip, Icon } from '@components';
import type { MainTabScreenProps } from '@navigation/types';

export const SettingsScreen: React.FC<MainTabScreenProps<'Settings'>> = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const themePreference = useAppSelector(state => state.settings.themePreference);
  const notificationSound = useAppSelector(state => state.settings.notificationSound);

  const [locationState, setLocationState] = useState<PermissionState>('denied');
  const [backgroundState, setBackgroundState] = useState<PermissionState>('denied');
  const [notificationState, setNotificationState] = useState<PermissionState>('denied');
  const mounted = useRef(true);

  const refreshPermissions = useCallback(async () => {
    const [fg, bg, notif] = await Promise.all([
      checkForegroundLocation(),
      checkBackgroundLocation(),
      checkNotifications(),
    ]);
    if (mounted.current) {
      setLocationState(fg);
      setBackgroundState(bg);
      setNotificationState(notif);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Re-check when the tab gains focus.
  useFocusEffect(
    useCallback(() => {
      refreshPermissions();
    }, [refreshPermissions]),
  );

  // Re-check when returning from system settings or a permission dialog.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refreshPermissions();
      }
    });
    return () => subscription.remove();
  }, [refreshPermissions]);

  const grantLocation = async (): Promise<void> => {
    const result = await requestForegroundLocation();
    if (result === 'blocked') {
      openAppSettings();
    }
    refreshPermissions();
  };

  const grantBackgroundLocation = async (): Promise<void> => {
    if ((await checkForegroundLocation()) !== 'granted') {
      await requestForegroundLocation();
    }
    const result = await requestBackgroundLocation();
    if (result === 'blocked') {
      openAppSettings();
    }
    refreshPermissions();
  };

  const grantNotifications = async (): Promise<void> => {
    const result = await requestNotifications();
    if (result === 'denied') {
      // Notifee returns 'denied' both for a fresh denial and a permanent one;
      // system settings is the reliable path either way on re-request.
      openAppSettings();
    }
    refreshPermissions();
  };

  return (
    <ScrollView
      testID="settings-screen"
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}>
      <Text style={[theme.typography.headlineMedium, { color: theme.colors.onSurface }]}>
        Settings
      </Text>

      <View style={styles.section}>
        <Text style={[theme.typography.labelLarge, { color: theme.colors.onSurfaceVariant }]}>
          Permissions
        </Text>
        <Card style={styles.cardList}>
          <PermissionRow
            icon="map-marker-outline"
            label="Location"
            state={locationState}
            onGrant={grantLocation}
          />
          <PermissionRow
            icon="map-marker-radius-outline"
            label="Background location"
            state={backgroundState}
            onGrant={grantBackgroundLocation}
          />
          <PermissionRow
            icon="bell-outline"
            label="Notifications"
            state={notificationState}
            onGrant={grantNotifications}
          />
          <Text
            testID="settings-open-system"
            onPress={openAppSettings}
            style={[theme.typography.labelLarge, styles.settingsLink, { color: theme.colors.primary }]}>
            Open system settings
          </Text>
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={[theme.typography.labelLarge, { color: theme.colors.onSurfaceVariant }]}>
          Notifications
        </Text>
        <Card style={styles.cardList}>
          <Text style={[theme.typography.bodyMedium, { color: theme.colors.onSurface }]}>
            Tone for arrival reminders
          </Text>
          <View style={styles.chipRow}>
            {NOTIFICATION_SOUNDS.map(sound => (
              <Chip
                key={sound.id}
                testID={`settings-sound-${sound.id}`}
                label={sound.label}
                icon={notificationSound === sound.id ? 'volume-high' : 'music-note-outline'}
                selected={notificationSound === sound.id}
                onPress={() => {
                  dispatch(setNotificationSound(sound.id));
                  previewNotificationSound(sound.id);
                }}
              />
            ))}
          </View>
          <Text style={[theme.typography.bodySmall, { color: theme.colors.onSurfaceVariant }]}>
            Tapping a tone plays a preview. New reminders use this tone by default; each
            reminder can still override it.
          </Text>
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={[theme.typography.labelLarge, { color: theme.colors.onSurfaceVariant }]}>
          Appearance
        </Text>
        <Card>
          <View style={styles.chipRow}>
            <Chip
              testID="settings-theme-system"
              label="System"
              icon="theme-light-dark"
              selected={themePreference === 'system'}
              onPress={() => dispatch(setThemePreference('system'))}
            />
            <Chip
              testID="settings-theme-light"
              label="Light"
              icon="white-balance-sunny"
              selected={themePreference === 'light'}
              onPress={() => dispatch(setThemePreference('light'))}
            />
            <Chip
              testID="settings-theme-dark"
              label="Dark"
              icon="weather-night"
              selected={themePreference === 'dark'}
              onPress={() => dispatch(setThemePreference('dark'))}
            />
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={[theme.typography.labelLarge, { color: theme.colors.onSurfaceVariant }]}>
          About
        </Text>
        <Card style={styles.cardList}>
          <View style={styles.aboutRow}>
            <Icon name="map-marker-radius" size={22} color={theme.colors.primary} />
            <View style={styles.aboutText}>
              <Text style={[theme.typography.titleMedium, { color: theme.colors.onSurface }]}>
                {APP_NAME}
              </Text>
              <Text style={[theme.typography.bodySmall, { color: theme.colors.onSurfaceVariant }]}>
                {APP_TAGLINE} — v{APP_VERSION}
              </Text>
            </View>
          </View>
          <Text style={[theme.typography.bodySmall, { color: theme.colors.onSurfaceVariant }]}>
            {APP_PRIVACY_NOTE}
          </Text>
        </Card>
      </View>
    </ScrollView>
  );
};

const PermissionRow: React.FC<{
  icon: string;
  label: string;
  state: PermissionState;
  onGrant: () => void;
}> = ({ icon, label, state, onGrant }) => {
  const theme = useTheme();
  const granted = state === 'granted';
  const color = granted ? theme.colors.success : theme.colors.warning;
  return (
    <Pressable
      onPress={granted ? undefined : onGrant}
      android_ripple={granted ? undefined : { color: theme.colors.ripple }}
      style={styles.permissionRow}>
      <Icon name={icon} size={20} color={theme.colors.onSurfaceVariant} />
      <Text
        style={[theme.typography.bodyMedium, styles.permissionLabel, { color: theme.colors.onSurface }]}>
        {label}
      </Text>
      <View style={styles.permissionState}>
        <Icon
          name={granted ? 'check-circle' : 'alert-circle-outline'}
          size={18}
          color={color}
        />
        <Text style={[theme.typography.labelSmall, { color }]}>
          {PERMISSION_STATE_LABELS[state]}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 20,
    paddingBottom: 48,
  },
  section: {
    gap: 10,
  },
  cardList: {
    gap: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  permissionLabel: {
    flex: 1,
  },
  permissionState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settingsLink: {
    marginTop: 4,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aboutText: {
    flex: 1,
  },
});
