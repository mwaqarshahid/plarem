import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, type ThemeColors } from '@theme';
import {
  requestBackgroundLocation,
  requestForegroundLocation,
  requestNotifications,
  warmUpLocation,
} from '@services';
import { APP_MOTTO, APP_NAME, APP_TAGLINE } from '@constants';
import { Button } from './Button';
import { Card } from './Card';
import { Icon } from './Icon';

type Step = 'welcome' | 'location' | 'background' | 'notifications';

interface PermissionsOnboardingProps {
  onComplete: () => void;
}

const STEPS: Step[] = ['welcome', 'location', 'background', 'notifications'];

const stepDotStyle = (active: boolean, colors: ThemeColors): ViewStyle => ({
  backgroundColor: active ? colors.primary : colors.outline,
  opacity: active ? 1 : 0.45,
});

export const PermissionsOnboarding: React.FC<PermissionsOnboardingProps> = ({ onComplete }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('welcome');
  const [busy, setBusy] = useState(false);

  const stepIndex = STEPS.indexOf(step);

  const finish = (): void => {
    warmUpLocation().catch(() => undefined);
    onComplete();
  };

  const goNext = (): void => {
    const next = STEPS[stepIndex + 1];
    if (next) {
      setStep(next);
      return;
    }
    finish();
  };

  const grantForeground = async (): Promise<void> => {
    setBusy(true);
    try {
      await requestForegroundLocation();
      await warmUpLocation();
    } finally {
      setBusy(false);
      goNext();
    }
  };

  const grantBackground = async (): Promise<void> => {
    setBusy(true);
    try {
      await requestBackgroundLocation();
    } finally {
      setBusy(false);
      goNext();
    }
  };

  const grantNotifications = async (): Promise<void> => {
    setBusy(true);
    try {
      await requestNotifications();
    } finally {
      setBusy(false);
      finish();
    }
  };

  return (
    <Modal visible animationType="fade" statusBarTranslucent testID="onboarding-modal">
      <View
        testID="onboarding-screen"
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 16,
          },
        ]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.brandRow}>
            <View
              style={[
                styles.brandIcon,
                { backgroundColor: theme.colors.primaryContainer, borderRadius: theme.radius.lg },
              ]}>
              <Icon name="map-marker-radius" size={32} color={theme.colors.primary} />
            </View>
            <View style={styles.brandText}>
              <Text style={[theme.typography.headlineMedium, { color: theme.colors.onSurface }]}>
                {APP_NAME}
              </Text>
              <Text style={[theme.typography.bodySmall, { color: theme.colors.onSurfaceVariant }]}>
                {APP_MOTTO}
              </Text>
            </View>
          </View>

          {step === 'welcome' ? (
            <Card style={styles.card}>
              <Text style={[theme.typography.titleLarge, { color: theme.colors.onSurface }]}>
                Welcome to {APP_NAME}
              </Text>
              <Text style={[theme.typography.bodyMedium, styles.body, { color: theme.colors.onSurfaceVariant }]}>
                {APP_TAGLINE}. To work properly, Plarem needs a few permissions on your device.
              </Text>
              <FeatureRow
                icon="map-marker-outline"
                title="Location"
                description="Know when you arrive at a place you chose"
              />
              <FeatureRow
                icon="map-marker-radius-outline"
                title="Background location"
                description="Trigger reminders even when the app is closed"
              />
              <FeatureRow
                icon="bell-outline"
                title="Notifications"
                description="Alert you the moment a reminder fires"
              />
              <Button
                testID="onboarding-continue"
                label="Continue"
                icon="arrow-right"
                onPress={goNext}
              />
            </Card>
          ) : null}

          {step === 'location' ? (
            <Card style={styles.card}>
              <Text style={[theme.typography.titleLarge, { color: theme.colors.onSurface }]}>
                Allow location access
              </Text>
              <Text style={[theme.typography.bodyMedium, styles.body, { color: theme.colors.onSurfaceVariant }]}>
                Plarem uses your location on-device to detect geofence arrivals. Nothing is uploaded.
              </Text>
              <Button
                testID="onboarding-allow-location"
                label="Allow while using the app"
                icon="crosshairs-gps"
                onPress={grantForeground}
                loading={busy}
              />
              <Button
                testID="onboarding-skip-location"
                label="Not now"
                variant="ghost"
                onPress={goNext}
                disabled={busy}
              />
            </Card>
          ) : null}

          {step === 'background' ? (
            <Card style={styles.card}>
              <Text style={[theme.typography.titleLarge, { color: theme.colors.onSurface }]}>
                Allow all the time
              </Text>
              <Text style={[theme.typography.bodyMedium, styles.body, { color: theme.colors.onSurfaceVariant }]}>
                For reminders to fire in the background, Android needs &quot;Allow all the time&quot; location
                access. You can change this later in Settings.
              </Text>
              <Button
                testID="onboarding-allow-background"
                label="Allow all the time"
                icon="map-marker-radius"
                onPress={grantBackground}
                loading={busy}
              />
              <Button
                testID="onboarding-skip-background"
                label="Skip for now"
                variant="ghost"
                onPress={goNext}
                disabled={busy}
              />
            </Card>
          ) : null}

          {step === 'notifications' ? (
            <Card style={styles.card}>
              <Text style={[theme.typography.titleLarge, { color: theme.colors.onSurface }]}>
                Allow notifications
              </Text>
              <Text style={[theme.typography.bodyMedium, styles.body, { color: theme.colors.onSurfaceVariant }]}>
                Get notified the moment you arrive at a reminder location.
              </Text>
              <Button
                testID="onboarding-allow-notifications"
                label="Allow notifications"
                icon="bell-ring-outline"
                onPress={grantNotifications}
                loading={busy}
              />
              <Button
                testID="onboarding-skip-notifications"
                label="Skip for now"
                variant="ghost"
                onPress={finish}
                disabled={busy}
              />
            </Card>
          ) : null}

          <View style={styles.dots}>
            {STEPS.map((item, index) => (
              <View
                key={item}
                style={[styles.dot, stepDotStyle(index === stepIndex, theme.colors)]}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const FeatureRow: React.FC<{ icon: string; title: string; description: string }> = ({
  icon,
  title,
  description,
}) => {
  const theme = useTheme();
  return (
    <View style={styles.featureRow}>
      <Icon name={icon} size={22} color={theme.colors.primary} />
      <View style={styles.featureText}>
        <Text style={[theme.typography.titleMedium, { color: theme.colors.onSurface }]}>{title}</Text>
        <Text style={[theme.typography.bodySmall, { color: theme.colors.onSurfaceVariant }]}>
          {description}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    gap: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  brandIcon: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    flex: 1,
    gap: 2,
  },
  card: {
    gap: 16,
  },
  body: {
    lineHeight: 22,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureText: {
    flex: 1,
    gap: 2,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
