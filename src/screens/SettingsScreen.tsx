import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@theme';
import { useAppDispatch, useAppSelector } from '@hooks';
import { setThemePreference } from '@store';
import {
  checkBackgroundLocation,
  checkForegroundLocation,
  checkNotifications,
  openAppSettings,
  PermissionState,
} from '@services';
import { Card, Chip, Icon } from '@components';
import type { MainTabScreenProps } from '@navigation/types';

const APP_VERSION = '0.1.0';

export const SettingsScreen: React.FC<MainTabScreenProps<'Settings'>> = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const themePreference = useAppSelector(state => state.settings.themePreference);

  const [locationState, setLocationState] = useState<PermissionState>('denied');
  const [backgroundState, setBackgroundState] = useState<PermissionState>('denied');
  const [notificationState, setNotificationState] = useState<PermissionState>('denied');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const [fg, bg, notif] = await Promise.all([
          checkForegroundLocation(),
          checkBackgroundLocation(),
          checkNotifications(),
        ]);
        if (active) {
          setLocationState(fg);
          setBackgroundState(bg);
          setNotificationState(notif);
        }
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <ScrollView
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
          />
          <PermissionRow
            icon="map-marker-radius-outline"
            label="Background location"
            state={backgroundState}
          />
          <PermissionRow icon="bell-outline" label="Notifications" state={notificationState} />
          <Text
            onPress={openAppSettings}
            style={[theme.typography.labelLarge, styles.settingsLink, { color: theme.colors.primary }]}>
            Open system settings
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
              label="System"
              icon="theme-light-dark"
              selected={themePreference === 'system'}
              onPress={() => dispatch(setThemePreference('system'))}
            />
            <Chip
              label="Light"
              icon="white-balance-sunny"
              selected={themePreference === 'light'}
              onPress={() => dispatch(setThemePreference('light'))}
            />
            <Chip
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
                Plarem
              </Text>
              <Text style={[theme.typography.bodySmall, { color: theme.colors.onSurfaceVariant }]}>
                Play a Reminder on Arrival — v{APP_VERSION}
              </Text>
            </View>
          </View>
          <Text style={[theme.typography.bodySmall, { color: theme.colors.onSurfaceVariant }]}>
            Reminders are stored locally on this device. Location is only used on-device to
            trigger geofences; nothing is uploaded.
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
}> = ({ icon, label, state }) => {
  const theme = useTheme();
  const granted = state === 'granted';
  const color = granted ? theme.colors.success : theme.colors.warning;
  return (
    <View style={styles.permissionRow}>
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
          {granted ? 'Granted' : 'Not granted'}
        </Text>
      </View>
    </View>
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
