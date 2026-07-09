import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@theme';
import { useAppDispatch, useAppSelector } from '@hooks';
import { addReminder, updateReminder } from '@store';
import {
  checkBackgroundLocation,
  checkForegroundLocation,
  checkNotifications,
  requestBackgroundLocation,
  requestForegroundLocation,
  requestNotifications,
} from '@services';
import { Button, Card, Chip, Icon, TextField } from '@components';
import { CATEGORIES, RADIUS_PRESETS } from '@constants';
import { CategoryId, ReminderRepeat } from '@types';
import { formatRadius } from '@utils';
import { showAlert } from '@utils/alert';
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
  const [category, setCategory] = useState<CategoryId>(existing?.category ?? 'personal');
  const [customCategory, setCustomCategory] = useState(existing?.customCategory ?? '');
  const [repeat, setRepeat] = useState<ReminderRepeat>(existing?.repeat ?? 'once');
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
    let fg = await checkForegroundLocation();
    if (fg !== 'granted') {
      fg = await requestForegroundLocation();
    }
    if (fg !== 'granted') {
      showAlert(
        'Location required',
        'Plarem needs location access to detect when you arrive at a place.',
      );
      return false;
    }

    let bg = await checkBackgroundLocation();
    if (bg !== 'granted') {
      bg = await requestBackgroundLocation();
    }
    if (bg !== 'granted') {
      showAlert(
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
      showAlert('Location missing', 'Choose where this reminder should trigger.');
      return;
    }

    setSaving(true);
    const ok = await ensurePermissions();
    if (!ok) {
      setSaving(false);
      return;
    }

    const base = {
      title: title.trim(),
      description: description.trim() || undefined,
      location,
      radius,
      category,
      customCategory: category === 'custom' ? customCategory.trim() || undefined : undefined,
      repeat,
    };

    if (existing) {
      dispatch(updateReminder({ id: existing.id, changes: base }));
    } else {
      dispatch(addReminder(base));
    }
    setSaving(false);
    navigation.goBack();
  };

  return (
    <ScrollView
      testID="reminder-form-screen"
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <TextField
        testID="form-title"
        errorTestID="form-title-error"
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
        testID="form-description"
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
          testID="form-location-card"
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
              testID="form-location-label"
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
              testID={`form-radius-${preset}`}
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
              testID={`form-category-${c.id}`}
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
          Repeat
        </Text>
        <View style={styles.chipRow}>
          <Chip
            testID="form-repeat-once"
            label="Once"
            selected={repeat === 'once'}
            onPress={() => setRepeat('once')}
          />
          <Chip
            testID="form-repeat-every-arrival"
            label="Every arrival"
            selected={repeat === 'every_arrival'}
            onPress={() => setRepeat('every_arrival')}
          />
        </View>
      </View>

      <Button
        testID="form-save"
        label="Save"
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
});
