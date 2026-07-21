import React, { useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, type ThemeColors } from '@theme';
import {
  getFreshPosition,
  isIgnoringBatteryOptimizations,
  requestBackgroundLocation,
  requestForegroundLocation,
  requestIgnoreBatteryOptimizations,
  requestNotifications,
  setCachedLocation,
  warmUpLocation,
} from '@services';
import { APP_MOTTO, APP_NAME, ONBOARDING } from '@constants';
import { BrandLogo } from './BrandLogo';
import { Button } from './Button';
import { Card } from './Card';
import { Icon } from './Icon';

type Step = 'welcome' | 'location' | 'background' | 'battery' | 'notifications';

interface PermissionsOnboardingProps {
  onComplete: () => void;
}

// The battery-optimization exemption is Android-only; it keeps our monitoring
// service alive on aggressive OEM battery managers.
const STEPS: Step[] = (
  ['welcome', 'location', 'background', 'battery', 'notifications'] as Step[]
).filter(step => step !== 'battery' || Platform.OS === 'android');

const stepDotStyle = (active: boolean, colors: ThemeColors): ViewStyle => ({
  backgroundColor: active ? colors.primary : colors.outline,
  opacity: active ? 1 : 0.45,
});

export const PermissionsOnboarding: React.FC<PermissionsOnboardingProps> = ({
  onComplete,
}) => {
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
      try {
        setCachedLocation(await getFreshPosition());
      } catch {
        await warmUpLocation();
      }
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

  const grantBattery = async (): Promise<void> => {
    setBusy(true);
    try {
      if (!(await isIgnoringBatteryOptimizations())) {
        requestIgnoreBatteryOptimizations();
      }
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
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandRow}>
            <BrandLogo size={56} />
            <View style={styles.brandText}>
              <Text
                style={[
                  theme.typography.headlineMedium,
                  { color: theme.colors.onSurface },
                ]}
              >
                {APP_NAME}
              </Text>
              <Text
                style={[
                  theme.typography.bodySmall,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {APP_MOTTO}
              </Text>
            </View>
          </View>

          {step === 'welcome' ? (
            <Card style={styles.card}>
              <Text
                style={[
                  theme.typography.titleLarge,
                  { color: theme.colors.onSurface },
                ]}
              >
                {ONBOARDING.welcome.title}
              </Text>
              <Text
                style={[
                  theme.typography.bodyMedium,
                  styles.body,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {ONBOARDING.welcome.body}
              </Text>
              {ONBOARDING.welcome.features.map(feature => (
                <FeatureRow
                  key={feature.title}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              ))}
              <Button
                testID="onboarding-continue"
                label={ONBOARDING.welcome.continueLabel}
                icon="arrow-right"
                onPress={goNext}
              />
            </Card>
          ) : null}

          {step === 'location' ? (
            <Card style={styles.card}>
              <Text
                style={[
                  theme.typography.titleLarge,
                  { color: theme.colors.onSurface },
                ]}
              >
                {ONBOARDING.location.title}
              </Text>
              <Text
                style={[
                  theme.typography.bodyMedium,
                  styles.body,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {ONBOARDING.location.body}
              </Text>
              <Button
                testID="onboarding-allow-location"
                label={ONBOARDING.location.allowLabel}
                icon="crosshairs-gps"
                onPress={grantForeground}
                loading={busy}
              />
              <Button
                testID="onboarding-skip-location"
                label={ONBOARDING.location.skipLabel}
                variant="ghost"
                onPress={goNext}
                disabled={busy}
              />
            </Card>
          ) : null}

          {step === 'background' ? (
            <Card style={styles.card}>
              <Text
                style={[
                  theme.typography.titleLarge,
                  { color: theme.colors.onSurface },
                ]}
              >
                {ONBOARDING.background.title}
              </Text>
              <Text
                style={[
                  theme.typography.bodyMedium,
                  styles.body,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {ONBOARDING.background.body}
              </Text>
              <Button
                testID="onboarding-allow-background"
                label={ONBOARDING.background.allowLabel}
                icon="map-marker-radius"
                onPress={grantBackground}
                loading={busy}
              />
              <Button
                testID="onboarding-skip-background"
                label={ONBOARDING.background.skipLabel}
                variant="ghost"
                onPress={goNext}
                disabled={busy}
              />
            </Card>
          ) : null}

          {step === 'battery' ? (
            <Card style={styles.card}>
              <Text
                style={[
                  theme.typography.titleLarge,
                  { color: theme.colors.onSurface },
                ]}
              >
                {ONBOARDING.battery.title}
              </Text>
              <Text
                style={[
                  theme.typography.bodyMedium,
                  styles.body,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {ONBOARDING.battery.body}
              </Text>
              <Button
                testID="onboarding-allow-battery"
                label={ONBOARDING.battery.allowLabel}
                icon="battery-heart-variant"
                onPress={grantBattery}
                loading={busy}
              />
              <Button
                testID="onboarding-skip-battery"
                label={ONBOARDING.battery.skipLabel}
                variant="ghost"
                onPress={goNext}
                disabled={busy}
              />
            </Card>
          ) : null}

          {step === 'notifications' ? (
            <Card style={styles.card}>
              <Text
                style={[
                  theme.typography.titleLarge,
                  { color: theme.colors.onSurface },
                ]}
              >
                {ONBOARDING.notifications.title}
              </Text>
              <Text
                style={[
                  theme.typography.bodyMedium,
                  styles.body,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {ONBOARDING.notifications.body}
              </Text>
              <Button
                testID="onboarding-allow-notifications"
                label={ONBOARDING.notifications.allowLabel}
                icon="bell-ring-outline"
                onPress={grantNotifications}
                loading={busy}
              />
              <Button
                testID="onboarding-skip-notifications"
                label={ONBOARDING.notifications.skipLabel}
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

const FeatureRow: React.FC<{
  icon: string;
  title: string;
  description: string;
}> = ({ icon, title, description }) => {
  const theme = useTheme();
  return (
    <View style={styles.featureRow}>
      <Icon name={icon} size={22} color={theme.colors.primary} />
      <View style={styles.featureText}>
        <Text
          style={[theme.typography.titleMedium, { color: theme.colors.onSurface }]}
        >
          {title}
        </Text>
        <Text
          style={[
            theme.typography.bodySmall,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
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
