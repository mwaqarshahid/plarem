import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme';
import { useAppDispatch, useAppSelector } from '@hooks';
import { FilterId, filterReminders, selectReminders, updateReminder } from '@store';
import { Coordinates, getCurrentPosition } from '@services';
import { Chip, EmptyState, Icon, ReminderCard, TextField } from '@components';
import type { MainTabScreenProps } from '@navigation/types';

const ListSeparator: React.FC = () => <View style={styles.separator} />;

const FILTERS: { id: FilterId; label: string; icon?: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today', icon: 'calendar-today' },
  { id: 'nearby', label: 'Nearby', icon: 'near-me' },
  { id: 'pending', label: 'Pending' },
  { id: 'completed', label: 'Completed' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'office', label: 'Office' },
  { id: 'disabled', label: 'Disabled' },
];

export const HomeScreen: React.FC<MainTabScreenProps<'Home'>> = ({ navigation }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const reminders = useAppSelector(selectReminders);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterId>('all');
  const [userLocation, setUserLocation] = useState<Coordinates | undefined>();

  useEffect(() => {
    if (filter === 'nearby' && !userLocation) {
      getCurrentPosition()
        .then(setUserLocation)
        .catch(() => setUserLocation(undefined));
    }
  }, [filter, userLocation]);

  const visible = useMemo(
    () => filterReminders(reminders, { search, filter, userLocation }),
    [reminders, search, filter, userLocation],
  );

  const handleToggle = (id: string, enabled: boolean): void => {
    dispatch(
      updateReminder({ id, changes: { enabled, status: enabled ? 'pending' : 'disabled' } }),
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={[theme.typography.headlineMedium, { color: theme.colors.onSurface }]}>
            Plarem
          </Text>
          <Text style={[theme.typography.bodySmall, { color: theme.colors.onSurfaceVariant }]}>
            {reminders.filter(r => r.status === 'pending').length} active reminders
          </Text>
        </View>
      </View>

      <View style={styles.searchWrapper}>
        <TextField
          placeholder="Search reminders, places, categories…"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
      </View>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}>
          {FILTERS.map(f => (
            <Chip
              key={f.id}
              label={f.label}
              icon={f.icon}
              selected={filter === f.id}
              onPress={() => setFilter(f.id)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={visible}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={ListSeparator}
        renderItem={({ item }) => (
          <ReminderCard
            reminder={item}
            onPress={() => navigation.navigate('ReminderDetails', { reminderId: item.id })}
            onToggleEnabled={enabled => handleToggle(item.id, enabled)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="map-marker-radius-outline"
            title={reminders.length === 0 ? 'No reminders yet' : 'Nothing matches'}
            message={
              reminders.length === 0
                ? 'Create your first location reminder and Plarem will notify you when you arrive.'
                : 'Try a different search term or filter.'
            }
          />
        }
      />

      <Pressable
        onPress={() => navigation.navigate('ReminderForm')}
        android_ripple={{ color: theme.colors.ripple }}
        style={[
          styles.fab,
          { backgroundColor: theme.colors.primary, borderRadius: theme.radius.xl },
        ]}>
        <Icon name="plus" size={28} color={theme.colors.onPrimary} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  filters: {
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  list: {
    padding: 20,
    paddingBottom: 120,
    flexGrow: 1,
  },
  separator: {
    height: 12,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
