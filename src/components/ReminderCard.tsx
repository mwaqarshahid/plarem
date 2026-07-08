import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@theme';
import { Reminder } from '@types';
import { getCategoryMeta, STATUS_COLORS, STATUS_LABELS } from '@constants';
import { formatRadius } from '@utils';
import { AppSwitch } from './AppSwitch';
import { Card } from './Card';
import { Icon } from './Icon';

interface ReminderCardProps {
  reminder: Reminder;
  onPress: () => void;
  onToggleEnabled: (enabled: boolean) => void;
}

export const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  onPress,
  onToggleEnabled,
}) => {
  const theme = useTheme();
  const category = getCategoryMeta(reminder.category);
  const categoryLabel =
    reminder.category === 'custom' && reminder.customCategory
      ? reminder.customCategory
      : category.label;
  const statusColor = STATUS_COLORS[reminder.status];
  const locationLabel = reminder.location.placeName ?? reminder.location.address;

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <View
          style={[
            styles.categoryIcon,
            { backgroundColor: `${category.color}22`, borderRadius: theme.radius.md },
          ]}>
          <Icon name={category.icon} size={22} color={category.color} />
        </View>
        <View style={styles.titleBlock}>
          <Text
            numberOfLines={1}
            style={[theme.typography.titleMedium, { color: theme.colors.onSurface }]}>
            {reminder.title}
          </Text>
          {reminder.description ? (
            <Text
              numberOfLines={1}
              style={[theme.typography.bodySmall, { color: theme.colors.onSurfaceVariant }]}>
              {reminder.description}
            </Text>
          ) : null}
        </View>
        <AppSwitch
          value={reminder.enabled}
          onValueChange={onToggleEnabled}
        />
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Icon name="map-marker-outline" size={16} color={theme.colors.onSurfaceVariant} />
          <Text
            numberOfLines={1}
            style={[
              theme.typography.bodySmall,
              styles.metaText,
              { color: theme.colors.onSurfaceVariant },
            ]}>
            {locationLabel}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Icon name="radar" size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={[theme.typography.bodySmall, { color: theme.colors.onSurfaceVariant }]}>
            {formatRadius(reminder.radius)}
          </Text>
        </View>
      </View>

      <View style={styles.footerRow}>
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
        <Text style={[theme.typography.labelSmall, { color: theme.colors.onSurfaceVariant }]}>
          {categoryLabel}
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  metaText: {
    flexShrink: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
