import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  createNavigationContainerRef,
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { useTheme } from '@theme';
import { Icon } from '@components';
import {
  HomeScreen,
  LocationPickerScreen,
  ReminderDetailsScreen,
  ReminderFormScreen,
  SettingsScreen,
} from '@screens';
import { setNotificationTapHandler } from '@services';
import type { MainTabParamList, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

interface TabIconProps {
  color: string;
  size: number;
}

const renderHomeIcon = ({ color, size }: TabIconProps) => (
  <Icon name="map-marker-radius-outline" size={size} color={color} />
);

const renderSettingsIcon = ({ color, size }: TabIconProps) => (
  <Icon name="cog-outline" size={size} color={color} />
);

const MainTabs: React.FC = () => {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Reminders',
          tabBarIcon: renderHomeIcon,
          tabBarButtonTestID: 'tab-reminders',
          tabBarAccessibilityLabel: 'Reminders',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: renderSettingsIcon,
          tabBarButtonTestID: 'tab-settings',
          tabBarAccessibilityLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};

export const RootNavigator: React.FC = () => {
  const theme = useTheme();

  useEffect(() => {
    setNotificationTapHandler(reminderId => {
      if (navigationRef.isReady()) {
        navigationRef.navigate('ReminderDetails', { reminderId });
      }
    });
  }, []);

  const navTheme = {
    ...(theme.dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.dark ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.onSurface,
      border: theme.colors.border,
    },
  };

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerTintColor: theme.colors.onSurface,
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTitleStyle: {
            fontSize: theme.typography.titleMedium.fontSize,
            fontWeight: theme.typography.titleMedium.fontWeight,
          },
          headerShadowVisible: false,
        }}>
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="ReminderForm"
          component={ReminderFormScreen}
          options={({ route }) => ({
            title: route.params?.reminderId ? 'Edit reminder' : 'New reminder',
          })}
        />
        <Stack.Screen
          name="ReminderDetails"
          component={ReminderDetailsScreen}
          options={{ title: 'Reminder' }}
        />
        <Stack.Screen
          name="LocationPicker"
          component={LocationPickerScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
