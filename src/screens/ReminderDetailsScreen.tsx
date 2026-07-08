import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTheme } from '@theme';
import { useAppDispatch, useAppSelector } from '@hooks';
import { deleteReminder, setReminderStatus } from '@store';
import { Button, Card, EmptyState, Icon } from '@components';
import { getCategoryMeta, STATUS_COLORS, STATUS_LABELS } from '@constants';
import { formatRadius, formatRelativeTime } from '@utils';
import { showAlert } from '@utils/alert';
import type { RootStackScreenProps } from '@navigation/types';

export const ReminderDetailsScreen: React.FC<RootStackScreenProps<'ReminderDetails'>> = ({
  navigation,
  route,
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const reminder = useAppSelector(state =>
    state.reminders.items.find(r => r.id === route.params.reminderId),
  );

  if (!reminder) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <EmptyState
          icon="bell-off-outline"
          title="Reminder not found"
          message="It may have been deleted."
        />
      </View>
    );
  }

  const category = getCategoryMeta(reminder.category);
  const statusColor = STATUS_COLORS[reminder.status];

  const handleDelete = (): void => {
    showAlert('Delete reminder', `Delete "${reminder.title}" permanently?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          dispatch(deleteReminder(reminder.id));
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}>
      <View style={[styles.mapWrapper, { borderRadius: theme.radius.xl }]}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          pointerEvents="none"
          userInterfaceStyle={theme.dark ? 'dark' : 'light'}
          initialRegion={{
            latitude: reminder.location.latitude,
            longitude: reminder.location.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}>
          <Marker
            coordinate={{
              latitude: reminder.location.latitude,
              longitude: reminder.location.longitude,
            }}
          />
          <Circle
            center={{
              latitude: reminder.location.latitude,
              longitude: reminder.location.longitude,
            }}
            radius={reminder.radius}
            strokeColor={theme.colors.primary}
            fillColor={theme.dark ? 'rgba(155,163,255,0.18)' : 'rgba(79,91,232,0.15)'}
            strokeWidth={2}
          />
        </MapView>
      </View>

      <View style={styles.headerRow}>
        <View
          style={[
            styles.categoryIcon,
            { backgroundColor: `${category.color}22`, borderRadius: theme.radius.md },
          ]}>
          <Icon name={category.icon} size={26} color={category.color} />
        </View>
        <View style={styles.headerText}>
          <Text style={[theme.typography.headlineMedium, { color: theme.colors.onSurface }]}>
            {reminder.title}
          </Text>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: `${statusColor}22`, borderRadius: theme.radius.pill },
            ]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[theme.typography.labelSmall, { color: statusColor }]}>
              {STATUS_LABELS[reminder.status]}
            </Text>
          </View>
        </View>
      </View>

      {reminder.description ? (
        <Text style={[theme.typography.bodyLarge, { color: theme.colors.onSurfaceVariant }]}>
          {reminder.description}
        </Text>
      ) : null}

      <Card style={styles.infoCard}>
        <InfoRow
          icon="map-marker-outline"
          label="Location"
          value={
            reminder.location.placeName
              ? `${reminder.location.placeName} — ${reminder.location.address}`
              : reminder.location.address
          }
        />
        <InfoRow icon="radar" label="Radius" value={formatRadius(reminder.radius)} />
        <InfoRow
          icon="tag-outline"
          label="Category"
          value={
            reminder.category === 'custom' && reminder.customCategory
              ? reminder.customCategory
              : category.label
          }
        />
        <InfoRow icon="flag-outline" label="Priority" value={reminder.priority} />
        <InfoRow
          icon="repeat"
          label="Repeat"
          value={reminder.repeat === 'once' ? 'Once' : 'Every arrival'}
        />
        <InfoRow
          icon="clock-outline"
          label="Last triggered"
          value={
            reminder.lastTriggeredAt ? formatRelativeTime(reminder.lastTriggeredAt) : 'Never'
          }
        />
      </Card>

      <View style={styles.actions}>
        {reminder.status === 'pending' ? (
          <>
            <Button
              label="Mark completed"
              icon="check-circle-outline"
              onPress={() => {
                dispatch(setReminderStatus({ id: reminder.id, status: 'completed' }));
              }}
            />
            <Button
              label="Skip"
              icon="debug-step-over"
              variant="secondary"
              onPress={() => {
                dispatch(setReminderStatus({ id: reminder.id, status: 'skipped' }));
              }}
            />
          </>
        ) : (
          <Button
            label="Reactivate"
            icon="restart"
            onPress={() => {
              dispatch(setReminderStatus({ id: reminder.id, status: 'pending' }));
            }}
          />
        )}
        <Button
          label="Edit"
          icon="pencil-outline"
          variant="secondary"
          onPress={() => navigation.navigate('ReminderForm', { reminderId: reminder.id })}
        />
        <Button label="Delete" icon="trash-can-outline" variant="danger" onPress={handleDelete} />
      </View>
    </ScrollView>
  );
};

const InfoRow: React.FC<{ icon: string; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => {
  const theme = useTheme();
  return (
    <View style={styles.infoRow}>
      <Icon name={icon} size={20} color={theme.colors.onSurfaceVariant} />
      <Text style={[theme.typography.bodyMedium, { color: theme.colors.onSurfaceVariant }]}>
        {label}
      </Text>
      <Text
        numberOfLines={2}
        style={[theme.typography.bodyMedium, styles.infoValue, { color: theme.colors.onSurface }]}>
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    gap: 20,
    paddingBottom: 48,
  },
  mapWrapper: {
    height: 200,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  categoryIcon: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  infoCard: {
    gap: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
  },
  actions: {
    gap: 12,
  },
});
