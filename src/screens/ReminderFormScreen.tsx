import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@theme';
import { useAppDispatch, useAppSelector } from '@hooks';
import { addReminder, updateReminder } from '@store';
import {
  checkNotifications,
  requestBackgroundLocation,
  requestForegroundLocation,
  requestNotifications,
} from '@services';
import { Button, Card, Chip, Icon, TextField } from '@components';
import {
  CATEGORIES,
  NOTIFICATION_SOUNDS,
  PRIORITIES,
  RADIUS_PRESETS,
} from '@constants';
import { CategoryId, ReminderPriority, ReminderRepeat } from '@types';
import { formatRadius } from '@utils';
import type { RootStackScreenProps } from '@navigation/types';

export const ReminderFormScreen: React.FC<RootStackScreenProps<'ReminderForm'>> = ({
  navigation,
  route,
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();

  const reminderId = route.params?.reminderId;
  const existing = useAppSelector(state =>
    state.reminders.items.find(r => r.id === reminderId),
  );

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [location, setLocation] = useState(existing?.location);
  const [radius, setRadius] = useState(existing?.radius ?? RADIUS_PRESETS[1]);
  const [sound, setSound] = useState(existing?.sound ?? NOTIFICATION_SOUNDS[0].id);
  const [priority, setPriority] = useState<ReminderPriority>(existing?.priority ?? 'medium');
  const [category, setCategory] = useState<CategoryId>(existing?.category ?? 'personal');
  const [customCategory, setCustomCategory] = useState(existing?.customCategory ?? '');
  const [repeat, setRepeat] = useState<ReminderRepeat>(existing?.repeat ?? 'once');
  const [enabled, setEnabled] = useState(existing?.enabled ?? true);
  const [titleError, setTitleError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  // Result pushed back from the LocationPicker screen.
  useFocusEffect(
    useCallback(() => {
      const pickedLocation = route.params?.pickedLocation;
      const pickedRadius = route.params?.pickedRadius;
      if (!pickedLocation && pickedRadius === undefined) {
        return;
      }
      if (pickedLocation) {
        setLocation(pickedLocation);
      }
      if (pickedRadius !== undefined) {
        setRadius(pickedRadius);
      }
      navigation.setParams({ pickedLocation: undefined, pickedRadius: undefined });
    }, [navigation, route.params?.pickedLocation, route.params?.pickedRadius]),
  );

  const ensurePermissions = async (): Promise<boolean> => {
    const fg = await requestForegroundLocation();
    if (fg !== 'granted') {
      Alert.alert(
        'Location required',
        'Plarem needs location access to detect when you arrive at a place.',
      );
      return false;
    }
    const bg = await requestBackgroundLocation();
    if (bg !== 'granted') {
      Alert.alert(
        'Background location recommended',
        'Without "Allow all the time" location access, reminders will not trigger while the app is closed.',
      );
    }
    if ((await checkNotifications()) !== 'granted') {
      await requestNotifications();
    }
    return true;
  };

  const handleSave = async (): Promise<void> => {
    if (!title.trim()) {
      setTitleError('Give your reminder a title');
      return;
    }
    if (!location) {
      Alert.alert('Location missing', 'Choose where this reminder should trigger.');
      return;
    }

    setSaving(true);
    if (enabled) {
      const ok = await ensurePermissions();
      if (!ok) {
        setSaving(false);
        return;
      }
    }

    const base = {
      title: title.trim(),
      description: description.trim() || undefined,
      location,
      radius,
      sound,
      priority,
      category,
      customCategory: category === 'custom' ? customCategory.trim() || undefined : undefined,
      repeat,
      enabled,
    };

    if (existing) {
      dispatch(
        updateReminder({
          id: existing.id,
          changes: { ...base, status: enabled ? 'pending' : 'disabled' },
        }),
      );
    } else {
      dispatch(addReminder(base));
    }
    setSaving(false);
    navigation.goBack();
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <TextField
        label="Title"
        placeholder="e.g. Buy eggs"
        value={title}
        onChangeText={text => {
          setTitle(text);
          if (titleError) {
            setTitleError(undefined);
          }
        }}
        error={titleError}
      />

      <TextField
        label="Description (optional)"
        placeholder="Any details you want to see in the notification"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        style={styles.multiline}
      />

      <View style={styles.section}>
        <Text style={[theme.typography.labelLarge, { color: theme.colors.onSurfaceVariant }]}>
          Location
        </Text>
        <Card
          onPress={() =>
            navigation.navigate('LocationPicker', { initial: location, initialRadius: radius })
          }
          style={styles.locationCard}>
          <Icon
            name={location ? 'map-marker' : 'map-marker-plus-outline'}
            size={24}
            color={theme.colors.primary}
          />
          <View style={styles.locationText}>
            <Text
              numberOfLines={2}
              style={[theme.typography.bodyMedium, { color: theme.colors.onSurface }]}>
              {location
                ? location.placeName
                  ? `${location.placeName} — ${location.address}`
                  : location.address
                : 'Choose a location'}
            </Text>
            {location ? (
              <Text style={[theme.typography.bodySmall, { color: theme.colors.onSurfaceVariant }]}>
                Radius: {formatRadius(radius)}
              </Text>
            ) : null}
          </View>
          <Icon name="chevron-right" size={22} color={theme.colors.onSurfaceVariant} />
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={[theme.typography.labelLarge, { color: theme.colors.onSurfaceVariant }]}>
          Arrival radius
        </Text>
        <View style={styles.chipRow}>
          {RADIUS_PRESETS.map(preset => (
            <Chip
              key={preset}
              label={formatRadius(preset)}
              selected={radius === preset}
              onPress={() => setRadius(preset)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[theme.typography.labelLarge, { color: theme.colors.onSurfaceVariant }]}>
          Category
        </Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map(c => (
            <Chip
              key={c.id}
              label={c.label}
              icon={c.icon}
              color={c.color}
              selected={category === c.id}
              onPress={() => setCategory(c.id)}
            />
          ))}
        </View>
        {category === 'custom' ? (
          <TextField
            placeholder="Custom category name"
            value={customCategory}
            onChangeText={setCustomCategory}
          />
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={[theme.typography.labelLarge, { color: theme.colors.onSurfaceVariant }]}>
          Priority
        </Text>
        <View style={styles.chipRow}>
          {PRIORITIES.map(p => (
            <Chip
              key={p.id}
              label={p.label}
              color={p.color}
              selected={priority === p.id}
              onPress={() => setPriority(p.id)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[theme.typography.labelLarge, { color: theme.colors.onSurfaceVariant }]}>
          Notification sound
        </Text>
        <View style={styles.chipRow}>
          {NOTIFICATION_SOUNDS.map(s => (
            <Chip
              key={s.id}
              label={s.label}
              selected={sound === s.id}
              onPress={() => setSound(s.id)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[theme.typography.labelLarge, { color: theme.colors.onSurfaceVariant }]}>
          Repeat
        </Text>
        <View style={styles.chipRow}>
          <Chip
            label="Once"
            selected={repeat === 'once'}
            onPress={() => setRepeat('once')}
          />
          <Chip
            label="Every arrival"
            selected={repeat === 'every_arrival'}
            onPress={() => setRepeat('every_arrival')}
          />
        </View>
      </View>

      <Card style={styles.enableRow}>
        <View style={styles.enableText}>
          <Text style={[theme.typography.titleMedium, { color: theme.colors.onSurface }]}>
            Enabled
          </Text>
          <Text style={[theme.typography.bodySmall, { color: theme.colors.onSurfaceVariant }]}>
            Monitoring starts as soon as you save
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={setEnabled}
          trackColor={{ true: theme.colors.primary, false: theme.colors.outline }}
          thumbColor={theme.colors.surface}
        />
      </Card>

      <Button
        label={existing ? 'Save changes' : 'Create reminder'}
        icon="check"
        onPress={handleSave}
        loading={saving}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 20,
    paddingBottom: 48,
  },
  multiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  section: {
    gap: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationText: {
    flex: 1,
    gap: 2,
  },
  enableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  enableText: {
    flex: 1,
    gap: 2,
  },
});
